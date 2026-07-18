import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { ENVIO_GRATIS_DESDE, PLAZO_ENTREGA, MARCA } from '../config.js';

export default function ProductPage() {
  const { id } = useParams();
  const [productos, setProductos] = useState(null);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const [imgActiva, setImgActiva] = useState(0);
  const { addItem } = useCart();
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setProductos)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    setQty(1);
    setImgActiva(0);
    window.scrollTo(0, 0);
  }, [id]);

  // Los hooks van antes de los return tempranos: p puede no existir aún
  const p = productos?.find((prod) => prod.id === Number(id));

  usePageMeta(
    p ? `${p.nombre} — ${MARCA}` : undefined,
    p ? p.descripcion : undefined
  );

  // Datos estructurados Product/Offer para buscadores (sin imagen mientras
  // los productos usen emojis; se añadirá con las fotos reales)
  useEffect(() => {
    if (!p) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.nombre,
      description: p.descripcion,
      ...(p.imagenes?.length
        ? { image: p.imagenes.map((src) => window.location.origin + src) }
        : {}),
      offers: {
        '@type': 'Offer',
        price: p.precio.toFixed(2),
        priceCurrency: 'EUR',
        availability:
          p.disponible === false
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
      },
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [p]);

  if (error) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">⚠️</div>
          <p>No se ha podido cargar el producto. Comprueba que el servidor está en marcha.</p>
          <Link className="btn btn-primary" to="/">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  if (!productos) {
    return <div className="container page"><p className="catalog-empty">Cargando…</p></div>;
  }

  if (!p) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">🔍</div>
          <p>Este producto no existe o ya no está disponible.</p>
          <Link className="btn btn-primary" to="/">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  const relacionados = productos
    .filter((r) => r.id !== p.id && r.categoria === p.categoria)
    .slice(0, 3);

  const dto =
    p.precioAntes && p.precioAntes > p.precio
      ? Math.round((1 - p.precio / p.precioAntes) * 100)
      : 0;
  const agotado = p.disponible === false;

  const comprar = () => {
    for (let i = 0; i < qty; i++) addItem(p);
    showToast(`✓ Añadido al carrito: ${qty} × ${p.nombre}`, {
      label: 'Ver carrito',
      to: '/carrito',
    });
  };

  // Compra directa: añade el producto y va directo al pago
  const comprarAhora = () => {
    for (let i = 0; i < qty; i++) addItem(p);
    navigate('/pedido');
  };

  return (
    <div className="container page">
      <Link className="btn-back" to="/">← Volver al catálogo</Link>

      <div className="detail-layout">
        <div className="detail-galeria">
          <div className="detail-img">
            {agotado ? (
              <span className="agotado-badge">Agotado</span>
            ) : (
              dto > 0 && <span className="dto-badge">−{dto}%</span>
            )}
            {p.imagenes?.length ? (
              <img
                className="detail-img-foto"
                src={p.imagenes[imgActiva] ?? p.imagenes[0]}
                alt={`${p.nombre} — imagen ${imgActiva + 1} de ${p.imagenes.length}`}
                width="800"
                height="800"
              />
            ) : (
              <span className="img-emoji">{p.imagen}</span>
            )}
          </div>
          {p.imagenes?.length > 1 && (
            <div className="detail-thumbs">
              {p.imagenes.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`detail-thumb ${i === imgActiva ? 'activa' : ''}`}
                  onClick={() => setImgActiva(i)}
                  aria-label={`Ver imagen ${i + 1} de ${p.imagenes.length}`}
                >
                  <img src={src} alt="" width="70" height="70" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className={`tag ${p.hot ? 'hot' : ''}`}>{p.tag}</span>
          <h1>{p.nombre}</h1>

          <div className="detail-price">
            {euros(p.precio)}
            {p.precioAntes ? <small>{euros(p.precioAntes)}</small> : null}
            <span className="iva-nota">IVA incluido</span>
          </div>

          <p className="detail-desc">{p.descripcion}</p>

          <ul className="detail-specs">
            {p.caracteristicas.map((c) => (
              <li key={c}>✓ {c}</li>
            ))}
          </ul>

          {agotado ? (
            <div className="detail-buy">
              <button className="btn btn-primary" disabled>
                Producto agotado
              </button>
            </div>
          ) : (
            <div className="detail-buy">
              <div className="qty">
                <button aria-label="Reducir cantidad" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button aria-label="Aumentar cantidad" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
              </div>
              <div className="detail-ctas">
                <button className="btn btn-primary detail-cta" onClick={comprar}>
                  Añadir al carrito
                </button>
                <button className="btn btn-comprar detail-cta" onClick={comprarAhora}>
                  Comprar ahora · {euros(p.precio * qty)}
                </button>
              </div>
            </div>
          )}

          <p className="detail-envio">
            🚚 Envío gratis a partir de {ENVIO_GRATIS_DESDE} € · ↩️ Devolución en 14 días · 🛡️ Garantía legal de 3 años
            <br />📦 Entrega estimada: {PLAZO_ENTREGA}
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="related">
          <h2>También te puede interesar</h2>
          <div className="grid grid-3">
            {relacionados.map((r) => {
              const foto = r.imagenes?.find((src) => /\.(jpe?g|png|webp)$/i.test(src));
              return (
              <div className="product" key={r.id}>
                <Link className="product-link" to={`/producto/${r.id}`}>
                  <div className="img">
                    {foto ? (
                      <img className="img-foto" src={foto} alt="" loading="lazy" />
                    ) : (
                      <span className="img-emoji">{r.imagen}</span>
                    )}
                  </div>
                  <h3>{r.nombre}</h3>
                </Link>
                <div className="price-row">
                  <div className="price">{euros(r.precio)}</div>
                  <Link className="add-btn" to={`/producto/${r.id}`}>Ver</Link>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
