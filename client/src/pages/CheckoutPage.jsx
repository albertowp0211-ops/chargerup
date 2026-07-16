import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { envioPara, MARCA, PLAZO_ENTREGA } from '../config.js';

const CAMPOS_INICIALES = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  cp: '',
};

// Solo guardamos los datos de envío para la próxima compra; los datos de
// pago nunca pasan por nuestra web (los gestiona Stripe)
const STORAGE_ENVIO = 'chargeup-envio';

const leerDatosGuardados = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_ENVIO));
    return guardado && typeof guardado === 'object' ? guardado : null;
  } catch {
    return null;
  }
};

export default function CheckoutPage() {
  const { items, total, promo, descuento } = useCart();
  const showToast = useToast();
  const [cliente, setCliente] = useState(() => {
    const guardado = leerDatosGuardados();
    return guardado ? { ...CAMPOS_INICIALES, ...guardado } : CAMPOS_INICIALES;
  });
  const [hayGuardados, setHayGuardados] = useState(() => leerDatosGuardados() !== null);
  const [enviando, setEnviando] = useState(false);
  const [acepta, setAcepta] = useState(false);

  usePageMeta(
    `Tramitar pedido — ${MARCA}`,
    'Introduce tus datos de envío y paga de forma segura con Stripe.'
  );

  // Al volver de Stripe con el botón Atrás, bfcache restaura la página con
  // el botón atascado en «Procesando…»; lo rearmamos
  useEffect(() => {
    const onPageShow = (e) => {
      if (e.persisted) setEnviando(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const envio = envioPara(total);

  const onChange = (e) =>
    setCliente((c) => ({ ...c, [e.target.name]: e.target.value }));

  const borrarGuardados = () => {
    localStorage.removeItem(STORAGE_ENVIO);
    setCliente(CAMPOS_INICIALES);
    setHayGuardados(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    // Recordamos los datos de envío para la próxima compra
    try {
      localStorage.setItem(STORAGE_ENVIO, JSON.stringify(cliente));
      setHayGuardados(true);
    } catch {
      // sin espacio o en modo privado: seguimos sin guardar
    }
    try {
      // Crea la sesión de pago y redirige a la página segura de Stripe
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente,
          items: items.map(({ id, qty }) => ({ id, qty })),
          ...(promo ? { promo: promo.codigo } : {}),
        }),
      });
      // Parseamos antes de mirar res.ok: un 502 del proxy devuelve HTML
      // y no queremos enseñar «Unexpected token '<'» al cliente
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `No se pudo iniciar el pago (error ${res.status})`);
      }
      window.location.href = data.url;
      // seguimos en estado "enviando" mientras el navegador redirige
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      setEnviando(false);
    }
  };

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
              <input name="nombre" autoComplete="name" required value={cliente.nombre} onChange={onChange} />
            </label>
            <label>
              Email *
              <input type="email" name="email" autoComplete="email" required value={cliente.email} onChange={onChange} />
            </label>
            <label>
              Teléfono
              <input type="tel" name="telefono" autoComplete="tel" value={cliente.telefono} onChange={onChange} />
            </label>
            <label className="span-2">
              Dirección *
              <input name="direccion" autoComplete="street-address" required value={cliente.direccion} onChange={onChange} />
            </label>
            <label>
              Ciudad *
              <input name="ciudad" autoComplete="address-level2" required value={cliente.ciudad} onChange={onChange} />
            </label>
            <label>
              Código postal *
              <input
                name="cp"
                autoComplete="postal-code"
                inputMode="numeric"
                required
                pattern="[0-9]{5}"
                title="5 dígitos"
                value={cliente.cp}
                onChange={onChange}
              />
            </label>
          </div>

          {hayGuardados && (
            <button type="button" className="btn-borrar-datos" onClick={borrarGuardados}>
              Borrar datos guardados
            </button>
          )}

          <p className="form-note">
            💳 Pago seguro con tarjeta a través de Stripe — Visa, Mastercard, Apple Pay y
            Google Pay. Tus datos de tarjeta nunca pasan por nuestra web.
          </p>

          <label className="form-consent">
            <input
              type="checkbox"
              required
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
            />
            <span>
              He leído y acepto las{' '}
              <Link to="/legal/condiciones" target="_blank" rel="noopener noreferrer">
                Condiciones Generales de Contratación
              </Link>{' '}
              y la{' '}
              <Link to="/legal/privacidad" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
              </Link>
              .
            </span>
          </label>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={enviando || !acepta}
          >
            {enviando ? 'Procesando…' : `Pagar ahora · ${euros(total - descuento + envio)}`}
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
          {descuento > 0 && (
            <div className="summary-row summary-descuento">
              <span>Descuento ({promo.codigo})</span>
              <span>−{euros(descuento)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Envío</span>
            <span>{envio === 0 ? 'Gratis' : euros(envio)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{euros(total - descuento + envio)}</span>
          </div>
          <p className="iva-nota">IVA incluido</p>
          <p className="entrega-nota">
            📦 Entrega estimada: {PLAZO_ENTREGA} desde la confirmación del pedido.
          </p>
          <Link className="btn-link" to="/carrito">
            ← Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  );
}
