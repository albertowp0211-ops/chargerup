import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CAMPOS_INICIALES = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  cp: '',
};

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const showToast = useToast();
  const [cliente, setCliente] = useState(CAMPOS_INICIALES);
  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  const envio = total >= 25 ? 0 : 4.99;

  const onChange = (e) =>
    setCliente((c) => ({ ...c, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (metodoPago === 'tarjeta') {
        // Crea la sesión de pago y redirige a la página segura de Stripe
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente,
            items: items.map(({ id, qty }) => ({ id, qty })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo iniciar el pago');
        window.location.href = data.url;
        return; // seguimos "enviando" mientras redirige
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente,
          items: items.map(({ id, qty }) => ({ id, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el pedido');
      setConfirmacion(data);
      clearCart();
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      setEnviando(false);
    }
  };

  if (confirmacion) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">✅</div>
          <h1 className="page-title">¡Pedido confirmado!</h1>
          <p>
            Tu número de pedido es <b>{confirmacion.id}</b> por un total de{' '}
            <b>{euros(confirmacion.total)}</b>. Guárdalo para cualquier consulta.
          </p>
          <Link className="btn btn-primary" to="/">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">Tramitar pedido</h1>
        <div className="empty-state">
          <div className="empty-ico">🛒</div>
          <p>No hay nada que tramitar: tu carrito está vacío.</p>
          <Link className="btn btn-primary" to="/">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page-title">Tramitar pedido</h1>

      <div className="cart-layout">
        <form className="checkout-form" onSubmit={onSubmit}>
          <h3>Datos de envío</h3>
          <div className="form-grid">
            <label className="span-2">
              Nombre completo *
              <input name="nombre" required value={cliente.nombre} onChange={onChange} />
            </label>
            <label>
              Email *
              <input type="email" name="email" required value={cliente.email} onChange={onChange} />
            </label>
            <label>
              Teléfono
              <input type="tel" name="telefono" value={cliente.telefono} onChange={onChange} />
            </label>
            <label className="span-2">
              Dirección *
              <input name="direccion" required value={cliente.direccion} onChange={onChange} />
            </label>
            <label>
              Ciudad *
              <input name="ciudad" required value={cliente.ciudad} onChange={onChange} />
            </label>
            <label>
              Código postal *
              <input name="cp" required pattern="[0-9]{5}" title="5 dígitos" value={cliente.cp} onChange={onChange} />
            </label>
          </div>

          <h3 className="pay-title">Método de pago</h3>
          <div className="pay-methods">
            <label className={metodoPago === 'tarjeta' ? 'active' : ''}>
              <input
                type="radio"
                name="metodoPago"
                value="tarjeta"
                checked={metodoPago === 'tarjeta'}
                onChange={() => setMetodoPago('tarjeta')}
              />
              <div>
                <b>💳 Tarjeta</b>
                <small>Visa, Mastercard, Apple Pay, Google Pay — pago seguro con Stripe</small>
              </div>
            </label>
            <label className={metodoPago === 'contrareembolso' ? 'active' : ''}>
              <input
                type="radio"
                name="metodoPago"
                value="contrareembolso"
                checked={metodoPago === 'contrareembolso'}
                onChange={() => setMetodoPago('contrareembolso')}
              />
              <div>
                <b>💶 Contra reembolso</b>
                <small>Pagas en efectivo al recibir el pedido</small>
              </div>
            </label>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
            {enviando
              ? 'Procesando…'
              : metodoPago === 'tarjeta'
                ? `Continuar al pago · ${euros(total + envio)}`
                : `Confirmar pedido · ${euros(total + envio)}`}
          </button>
        </form>

        <aside className="cart-summary">
          <h3>Tu pedido</h3>
          {items.map((i) => (
            <div className="summary-row" key={i.id}>
              <span>
                {i.imagen} {i.nombre} × {i.qty}
              </span>
              <span>{euros(i.precio * i.qty)}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Envío</span>
            <span>{envio === 0 ? 'Gratis' : euros(envio)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{euros(total + envio)}</span>
          </div>
          <Link className="btn-link" to="/carrito">
            ← Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  );
}
