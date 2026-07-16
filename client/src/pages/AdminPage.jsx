import { useCallback, useEffect, useState } from 'react';
import { euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { MARCA } from '../config.js';

const TOKEN_KEY = 'chargeup-admin-token';

const fecha = (iso) =>
  new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AdminPage() {
  const showToast = useToast();
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [pedidos, setPedidos] = useState(null);
  const [error, setError] = useState(false);

  usePageMeta(`Panel de pedidos — ${MARCA}`);

  const cerrarSesion = useCallback(() => {
    const t = sessionStorage.getItem(TOKEN_KEY);
    // Invalida el token también en el servidor; si falla (p. ej. ya
    // caducado), el borrado local basta.
    if (t) {
      fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPedidos(null);
    setPassword('');
  }, []);

  const cargar = useCallback(() => {
    if (!token) return;
    setError(false);
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) {
          cerrarSesion();
          return Promise.reject(401);
        }
        // Parseamos con red de seguridad: si el proxy devuelve HTML (502)
        // no dejamos que reviente con «Unexpected token '<'»
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data)) return Promise.reject(res.status);
        return data;
      })
      .then((data) => setPedidos([...data].reverse()))
      .catch((e) => {
        if (e !== 401) setError(true);
      });
  }, [token, cerrarSesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const onLogin = async (e) => {
    e.preventDefault();
    setEntrando(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      // Parseamos antes de mirar res.ok: un 502 del proxy devuelve HTML
      // y no queremos enseñar «Unexpected token '<'» al cliente
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `No se pudo iniciar sesión (error ${res.status})`);
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setEntrando(false);
    }
  };

  if (!token) {
    return (
      <div className="container page">
        <div className="login-box">
          <div className="empty-ico">🔐</div>
          <h1 className="page-title">Panel de pedidos</h1>
          <p className="page-desc">Introduce la contraseña de administración para continuar.</p>
          <form onSubmit={onLogin}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            {loginError && <p className="login-error">⚠️ {loginError}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={entrando}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Copia los datos de envío listos para pegar en el checkout de AliExpress
  const copiarDireccion = (p) => {
    const texto = [
      `Nombre: ${p.cliente.nombre}`,
      `Dirección: ${p.cliente.direccion}`,
      `Ciudad: ${p.cliente.ciudad}`,
      `Código postal: ${p.cliente.cp}`,
      p.cliente.telefono ? `Teléfono: ${p.cliente.telefono}` : null,
      `Email: ${p.cliente.email}`,
    ]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard?.writeText(texto);
    showToast(`📋 Dirección de ${p.id} copiada`);
  };

  const ingresos = (pedidos ?? []).reduce((s, p) => s + p.total, 0);
  const ticketMedio = pedidos?.length ? ingresos / pedidos.length : 0;

  return (
    <div className="container page">
      <div className="admin-head">
        <div>
          <h1 className="page-title">Panel de pedidos</h1>
          <p className="page-desc">Pedidos recibidos en la tienda, del más reciente al más antiguo.</p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" onClick={cargar}>
            ↻ Actualizar
          </button>
          <button className="btn btn-outline" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {error && (
        <p className="catalog-empty">
          No se han podido cargar los pedidos. Comprueba que el servidor está en marcha.
        </p>
      )}

      {pedidos && (
        <>
          <div className="admin-stats">
            <div className="stat">
              <small>Pedidos</small>
              <b>{pedidos.length}</b>
            </div>
            <div className="stat">
              <small>Ingresos</small>
              <b>{euros(ingresos)}</b>
            </div>
            <div className="stat">
              <small>Ticket medio</small>
              <b>{euros(ticketMedio)}</b>
            </div>
          </div>

          {pedidos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-ico">📭</div>
              <p>Todavía no hay pedidos.</p>
            </div>
          ) : (
            <div className="order-list">
              {pedidos.map((p) => (
                <details className="order" key={p.id}>
                  <summary>
                    <span className="order-id">{p.id}</span>
                    <span className="order-fecha">{fecha(p.fecha)}</span>
                    <span className="order-cliente">
                      {p.cliente.nombre} · {p.cliente.ciudad}
                    </span>
                    <span className="order-total">{euros(p.total)}</span>
                  </summary>
                  <div className="order-body">
                    <div className="order-datos">
                      <p><b>Envío:</b> {p.cliente.direccion}, {p.cliente.cp} {p.cliente.ciudad}</p>
                      <p>
                        <b>Contacto:</b> {p.cliente.email}
                        {p.cliente.telefono ? ` · ${p.cliente.telefono}` : ''}
                      </p>
                      <button className="btn-copiar" onClick={() => copiarDireccion(p)}>
                        📋 Copiar dirección de envío
                      </button>
                    </div>
                    <table className="order-lineas">
                      <thead>
                        <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
                      </thead>
                      <tbody>
                        {p.lineas.map((l) => (
                          <tr key={l.id}>
                            <td>
                              {l.nombre}{' '}
                              <a
                                className="ali-link"
                                href={`https://es.aliexpress.com/wholesale?SearchText=${encodeURIComponent(l.nombre)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                AliExpress ↗
                              </a>
                            </td>
                            <td>{l.qty}</td>
                            <td>{euros(l.precio)}</td>
                            <td>{euros(l.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3">Envío</td>
                          <td>{p.envio === 0 ? 'Gratis' : euros(p.envio)}</td>
                        </tr>
                        <tr className="order-tfoot-total">
                          <td colSpan="3">Total</td>
                          <td>{euros(p.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
