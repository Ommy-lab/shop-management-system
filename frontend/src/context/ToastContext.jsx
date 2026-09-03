import { createContext, useCallback, useContext, useMemo, useState } from 'react';
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const notify = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => remove(id), 4200);
  }, [remove]);
  const value = useMemo(() => ({ notify }), [notify]);
  return <ToastContext.Provider value={value}>{children}<div className="toast-stack" aria-live="polite">{toasts.map((toast) => <button type="button" className={`toast toast--${toast.type}`} key={toast.id} onClick={() => remove(toast.id)}>{toast.message}<span>×</span></button>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
