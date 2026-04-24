import React, { useState, useEffect } from 'react';

const ToastItem = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : ''}`}>
      <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
      <span>{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>×</button>
    </div>
  );
};

const Toast = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default Toast;
