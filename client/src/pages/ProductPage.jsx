import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const [productos, setProductos] = useState(null);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const showToast = useToast();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setProductos)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    setQty(1);
    window.scrollTo(0, 0);
  }, [id]);

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

  const p = productos.find((prod) => prod.id === Number(id));

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

  const comprar = () => {
    for (let i = 0; i < qty; i++) addItem(p);
    showToast(`✓ Añadido al carrito: ${qty} × ${p.nombre}`);
  };

  return (
    <div className="container page">
      <Link className="btn-back" to="/">← Volver al catálogo</Link>

      <div className="detail-layout">
        <div className="detail-img">{p.imagen}</div>

        <div className="detail-info">
          <span className={`tag ${p.hot ? 'hot' : ''}`}>{p.tag}</span>
          <h1>{p.nombre}</h1>
          <div className="stars">
            {'★'.repeat(p.rating)}
            {'☆'.repeat(5 - p.rating)} <small>({p.reviews} valoraciones)</small>
          </div>

          <div className="detail-price">
            {euros(p.precio)}
            {p.precioAntes ? <small>{euros(p.precioAntes)}</small> : null}
          </div>

          <p className="detail-desc">{p.descripcion}</p>

          <ul className="detail-specs">
            {p.caracteristicas.map((c) => (
              <li key={c}>✓ {c}</li>
            ))}
          </ul>

          <div className="detail-buy">
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
            </div>
            <button className="btn btn-primary" onClick={comprar}>
              Añadir al carrito · {euros(p.precio * qty)}
            </button>
          </div>

          <p className="detail-envio">
            🚚 Envío 24/48h — gratis a partir de 25€ · ↩️ Devolución en 30 días · 🛡️ Garantía 3 años
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="related">
          <h2>También te puede interesar</h2>
          <div className="grid grid-3">
            {relacionados.map((r) => (
              <div className="product" key={r.id}>
                <Link className="product-link" to={`/producto/${r.id}`}>
                  <div className="img">{r.imagen}</div>
                  <h3>{r.nombre}</h3>
                </Link>
                <div className="price-row">
                  <div className="price">{euros(r.precio)}</div>
                  <Link className="add-btn" to={`/producto/${r.id}`}>Ver</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
