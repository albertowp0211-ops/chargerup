import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { ENVIO_GRATIS_DESDE, envioPara, MARCA } from '../config.js';

export default function CartPage() {
  const { items, setQty, removeItem, total, count, promo, descuento, aplicarPromo, quitarPromo } =
    useCart();
  const [codigo, setCodigo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [aplicando, setAplicando] = useState(false);

  usePageMeta(
    `Tu carrito — ${MARCA}`,
    `Revisa los productos de tu carrito y tramita tu pedido en ${MARCA}.`
  );

  const onAplicarPromo = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setAplicando(true);
    setPromoError('');
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      // Parseamos antes de mirar res.ok: un 502 del proxy devuelve HTML
      // y no queremos enseñar «Unexpected token '<'» al cliente
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Este código no es válido');
      aplicarPromo(data);
      setCodigo('');
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setAplicando(false);
    }
  };

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

          {promo ? (
            <div className="promo-aplicado">
              <span>
                🏷️ <b>{promo.codigo}</b> (−{promo.pct}%)
              </span>
              <button
                type="button"
                title="Quitar código"
                aria-label={`Quitar el código ${promo.codigo}`}
                onClick={quitarPromo}
              >
                ✕
              </button>
            </div>
          ) : (
            <form className="promo-form" onSubmit={onAplicarPromo}>
              <label htmlFor="promo-input">¿Tienes un código promocional?</label>
              <div className="promo-campos">
                <input
                  id="promo-input"
                  placeholder="Código"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    setPromoError('');
                  }}
                  maxLength={40}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="btn btn-outline"
                  disabled={aplicando || !codigo.trim()}
                >
                  {aplicando ? '…' : 'Aplicar'}
                </button>
              </div>
              {promoError && <p className="promo-error">⚠️ {promoError}</p>}
            </form>
          )}

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{euros(total)}</span>
          </div>
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
