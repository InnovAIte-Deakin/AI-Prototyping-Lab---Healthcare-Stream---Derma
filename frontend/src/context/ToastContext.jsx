import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let toastCounter = 0;

const toneStyles = {
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-slate-200 bg-white text-slate-900',
};

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 shadow-lg ${toneStyles[toast.tone] || toneStyles.info}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message && (
                <p className="text-sm text-slate-700">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const id = toast.id ?? `toast-${Date.now()}-${toastCounter++}`;
      const entry = {
        id,
        tone: toast.tone || 'error',
        title: toast.title || 'Notice',
        message: toast.message || '',
        timeout: toast.timeout ?? 5000,
      };
      setToasts((items) => [...items, entry]);

      if (entry.timeout > 0) {
        window.setTimeout(() => removeToast(id), entry.timeout);
      }
    },
    [removeToast],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
