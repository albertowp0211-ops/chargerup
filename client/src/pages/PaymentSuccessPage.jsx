import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { clearCart } = useCart();
  const [estado, setEstado] = useState('confirmando');
  const [pedido, setPedido] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const confirmado = useRef(false);

  useEffect(() => {
    if (!sessionId || confirmado.current) return;
    confirmado.current = true;

    fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo confirmar el pago');
        setPedido(data);
        setEstado('exito');
        clearCart();
      })
      .catch((err) => {
        setMensajeError(err.message);
        setEstado('error');
      });
  }, [sessionId, clearCart]);

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
          <p>{mensajeError} — Si el cargo aparece en tu tarjeta, escríbenos a hola@chargeup.es con la fecha y hora.</p>
          <Link className="btn btn-primary" to="/pedido">Volver a intentarlo</Link>
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
