import { Link } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { ENVIO_GRATIS_DESDE, envioPara, MARCA } from '../config.js';

export default function CartPage() {
  const { items, setQty, removeItem, total, count } = useCart();

  usePageMeta(
    `Tu carrito — ${MARCA}`,
    `Revisa los productos de tu carrito y tramita tu pedido en ${MARCA}.`
  );

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">Tu carrito</h1>
        <div className="empty-state">
          <div className="empty-ico">🛒</div>
          <p>Tu carrito está vacío.</p>
          <Link className="btn btn-primary" to="/">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  const envio = envioPara(total);
  const falta = ENVIO_GRATIS_DESDE - total;

  return (
    <div className="container page">
      <h1 className="page-title">
        Tu carrito <span className="page-sub">({count} productos)</span>
      </h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((i) => (
            <div className="cart-item" key={i.id}>
              <div className="cart-img">{i.imagen}</div>
              <div className="cart-info">
                <h3>{i.nombre}</h3>
                <small>{euros(i.precio)} / unidad</small>
              </div>
              <div className="qty">
                <button
                  aria-label={`Reducir cantidad de ${i.nombre}`}
                  onClick={() => setQty(i.id, i.qty - 1)}
                >
                  −
                </button>
                <span>{i.qty}</span>
                <button
                  aria-label={`Aumentar cantidad de ${i.nombre}`}
                  onClick={() => setQty(i.id, i.qty + 1)}
                >
                  +
                </button>
              </div>
              <div className="cart-subtotal">{euros(i.precio * i.qty)}</div>
              <button
                className="cart-remove"
                title="Eliminar"
                aria-label={`Eliminar ${i.nombre} del carrito`}
                onClick={() => removeItem(i.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h3>Resumen</h3>

          {falta > 0 ? (
            <div className="envio-progreso">
              <p>
                Te faltan <b>{euros(falta)}</b> para el envío gratis
              </p>
              <div
                className="progreso-barra"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax={ENVIO_GRATIS_DESDE}
                aria-valuenow={Math.min(total, ENVIO_GRATIS_DESDE)}
              >
                <div
                  className="progreso-relleno"
                  style={{ width: `${Math.min(100, (total / ENVIO_GRATIS_DESDE) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="envio-progreso envio-conseguido">✅ Envío gratis conseguido</p>
          )}

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{euros(total)}</span>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span>{envio === 0 ? 'Gratis' : euros(envio)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{euros(total + envio)}</span>
          </div>
          <p className="iva-nota">IVA incluido</p>
          <Link className="btn btn-primary btn-block" to="/pedido">
            Tramitar pedido
          </Link>
          <Link className="btn-link" to="/">
            ← Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
