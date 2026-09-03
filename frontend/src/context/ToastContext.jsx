import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, error = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, error }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.error ? 'error' : ''}`}>
            <div className="toast-icon">
              {t.error ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, flex: 1 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} className="btn-ghost" style={{ padding: '0.25rem' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
