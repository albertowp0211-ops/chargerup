import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', accion: null, visible: false });
  const timer = useRef(null);

  // Acción opcional: { label, to } muestra un enlace dentro del toast
  // (p. ej. «Ver carrito») y alarga el tiempo en pantalla para poder pulsarlo
  const showToast = useCallback((msg, accion = null) => {
    setToast({ msg, accion, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      accion ? 4000 : 2200
    );
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={`toast ${toast.visible ? 'show' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast.msg}
        {toast.accion && (
          <Link className="toast-accion" to={toast.accion.to}>
            {toast.accion.label}
          </Link>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
