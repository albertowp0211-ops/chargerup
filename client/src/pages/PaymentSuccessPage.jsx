import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { MARCA, EMAIL_CONTACTO } from '../config.js';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { clearCart } = useCart();
  const [estado, setEstado] = useState('confirmando');
  const [pedido, setPedido] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const confirmado = useRef(false);

  usePageMeta(
    `Confirmando tu pago — ${MARCA}`,
    `Estamos verificando tu pago y preparando tu pedido en ${MARCA}.`
  );

  // El endpoint es idempotente: podemos reintentar la confirmación con el
  // mismo session_id sin que se duplique el pedido
  const confirmar = useCallback(() => {
    if (!sessionId || confirmado.current) return;
    confirmado.current = true;

    fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(async (res) => {
        // Parseamos antes de mirar res.ok: un 502 del proxy devuelve HTML
        // y no queremos enseñar «Unexpected token '<'» al cliente
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `No se pudo confirmar el pago (error ${res.status})`);
        }
        setPedido(data);
        setEstado('exito');
        clearCart();
        // Quitamos el session_id de la URL una vez confirmado: es el
        // secreto que acepta /api/orders/confirm y no debe quedar en el
        // historial, en el Referer ni en la analítica.
        window.history.replaceState(null, '', '/pedido/exito');
      })
      .catch((err) => {
        setMensajeError(err.message);
        setEstado('error');
      });
  }, [sessionId, clearCart]);

  useEffect(() => {
    confirmar();
  }, [confirmar]);

  // Rearma el intento y vuelve a lanzar la misma confirmación
  const reintentar = () => {
    confirmado.current = false;
    setMensajeError('');
    setEstado('confirmando');
    confirmar();
  };

  if (!sessionId) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">🔍</div>
          <p>Falta la referencia del pago.</p>
          <Link className="btn btn-primary" to="/">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  if (estado === 'confirmando') {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">⏳</div>
          <h1 className="page-title">Confirmando tu pago…</h1>
          <p>Un momento, estamos verificando el pago con el banco.</p>
        </div>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">⚠️</div>
          <h1 className="page-title">No se pudo confirmar el pago</h1>
          <p>{mensajeError} — Si el cargo aparece en tu tarjeta, escríbenos a {EMAIL_CONTACTO} con la fecha y hora.</p>
          <button className="btn btn-primary" onClick={reintentar}>
            Reintentar confirmación
          </button>
          <Link className="btn-link" to="/">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="empty-state">
        <div className="empty-ico">✅</div>
        <h1 className="page-title">¡Pago completado!</h1>
        <p>
          Tu número de pedido es <b>{pedido.id}</b> por un total de{' '}
          <b>{euros(pedido.total)}</b>. Te hemos enviado la confirmación por email.
        </p>
        <Link className="btn btn-primary" to="/">Volver a la tienda</Link>
      </div>
    </div>
  );
}
