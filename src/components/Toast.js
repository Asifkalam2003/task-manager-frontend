import { useState, useCallback } from 'react';

let toastId = 0;
let addToastFn = null;

export const toast = {
  success: (msg) => addToastFn?.({ id: ++toastId, type: 'success', msg }),
  error: (msg) => addToastFn?.({ id: ++toastId, type: 'error', msg }),
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
};
