import { useEffect, useState } from 'react';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Barra fija inferior con la oferta principal. Aparece cuando el visitante
 * ha pasado el hero, para que el botón de comprar esté siempre a un toque
 * sin tapar la portada nada más entrar.
 */
export default function BarraCompra({ destacadoId = 16 }) {
  const [producto, setProducto] = useState(null);
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();
  const showToast = useToast();

  useEffect(() => {
    let vivo = true;
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((lista) => {
        if (!vivo) return;
        setProducto(lista.find((p) => p.id === destacadoId) ?? lista[0] ?? null);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [destacadoId]);

  useEffect(() => {
    const alScroll = () => setVisible(window.scrollY > 560);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  if (!producto || producto.disponible === false) return null;

  const dto =
    producto.precioAntes && producto.precioAntes > producto.precio
      ? Math.round((1 - producto.precio / producto.precioAntes) * 100)
      : 0;

  return (
    <div className={`barra-compra ${visible ? 'visible' : ''}`}>
      <div className="container barra-inner">
        <img src={producto.imagenes?.[0]} alt="" className="barra-foto" />

        <div className="barra-texto">
          <b>{producto.nombre}</b>
        </div>

        <div className="barra-precio">
          {euros(producto.precio)}
          {dto > 0 && <small>{euros(producto.precioAntes)}</small>}
        </div>

        <button
          className="btn btn-primary barra-btn"
          onClick={() => {
            addItem(producto);
            showToast(`✓ Añadido al carrito: ${producto.nombre}`, {
              label: 'Ir a pagar',
              to: '/carrito',
            });
          }}
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
