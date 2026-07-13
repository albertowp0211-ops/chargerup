import { Link } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';

export default function CartPage() {
  const { items, setQty, removeItem, total, count } = useCart();

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
                <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                <span>{i.qty}</span>
                <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
              </div>
              <div className="cart-subtotal">{euros(i.precio * i.qty)}</div>
              <button
                className="cart-remove"
                title="Eliminar"
                onClick={() => removeItem(i.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h3>Resumen</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{euros(total)}</span>
          </div>
          <div className="summary-row">
            <span>Envío</span>
            <span>{total >= 25 ? 'Gratis' : euros(4.99)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{euros(total >= 25 ? total : total + 4.99)}</span>
          </div>
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
