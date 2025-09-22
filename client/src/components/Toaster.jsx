import React, { useState, useEffect } from 'react';

export function Toaster() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'info' | 'error'

  useEffect(() => {
    const handleToast = (e) => {
      // admite detail como string o { message, type }
      if (typeof e.detail === 'string') {
        setMessage(e.detail);
        setType('info');
      } else if (e.detail && typeof e.detail.message === 'string') {
        setMessage(e.detail.message);
        setType(e.detail.type || 'info');
      }
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  if (!visible) return null;

  const base = 'fixed bottom-5 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-lg text-center';
  const color = type === 'error' ? 'bg-red-700' : 'bg-green-800';
  return <div className={`${base} ${color}`}>{message}</div>;
}
