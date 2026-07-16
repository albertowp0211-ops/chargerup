import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { MARCA, EMAIL_CONTACTO } from '../config.js';

// Formulario de desistimiento en línea (Directiva UE 2023/2673). Envía la
// solicitud a /api/desistimiento, que verifica el pedido y manda un acuse
// de recibo con fecha y hora.
export default function DesistirPage() {
  const [pedido, setPedido] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] = useState('form'); // form | enviando | ok | error
  const [mensaje, setMensaje] = useState('');
  const [fecha, setFecha] = useState('');

  usePageMeta(
    `Desistir del contrato — ${MARCA}`,
    'Ejerce tu derecho de desistimiento en línea indicando tu número de pedido.'
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      const res = await fetch('/api/desistimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido, email, motivo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `No se pudo enviar la solicitud (error ${res.status})`);
      setFecha(data.fecha || '');
      setEstado('ok');
    } catch (err) {
      setMensaje(err.message);
      setEstado('error');
    }
  };

  if (estado === 'ok') {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">✅</div>
          <h1 className="page-title">Solicitud de desistimiento recibida</h1>
          <p>
            Hemos registrado tu solicitud del pedido <b>{pedido}</b>
            {fecha ? (
              <>
                {' '}el <b>{fecha}</b>
              </>
            ) : null}
            . Te hemos enviado un acuse de recibo por email con las instrucciones
            de devolución.
          </p>
          <Link className="btn btn-primary" to="/">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page-title">Desistir del contrato</h1>
      <div className="cart-layout">
        <form className="checkout-form" onSubmit={onSubmit}>
          <h3>Ejerce tu derecho de desistimiento (14 días)</h3>
          <p className="form-note">
            Indica el número de pedido y el email con el que compraste. Recibirás
            un acuse de recibo con la fecha y hora de tu solicitud.
          </p>
          <div className="form-grid">
            <label className="span-2">
              Número de pedido *
              <input
                name="pedido"
                required
                placeholder="CU-…"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
              />
            </label>
            <label className="span-2">
              Email de la compra *
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="span-2">
              Motivo (opcional)
              <textarea
                name="motivo"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          </div>
          {estado === 'error' && <p className="login-error">{mensaje}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud de desistimiento'}
          </button>
          <p className="form-note">
            También puedes desistir escribiendo a {EMAIL_CONTACTO}. Consulta los
            detalles en la{' '}
            <Link to="/legal/desistimiento">Política de Desistimiento y Devoluciones</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
