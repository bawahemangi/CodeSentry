import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'var(--color-info)';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'var(--color-success)';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'var(--color-warning)';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'var(--color-danger)';
          }

          return (
            <div key={toast.id} className="toast">
              <Icon size={18} style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
