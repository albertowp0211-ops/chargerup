import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', visible: false });
  const timer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ msg, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2200
    );
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast ${toast.visible ? 'show' : ''}`}>{toast.msg}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
