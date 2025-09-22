import React, { useState, useEffect } from 'react';

export function Toaster() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleToast = (e) => {
      setMessage(e.detail);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-800 text-white px-6 py-3 rounded-full shadow-lg text-center">
      {message}
    </div>
  );
}
