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

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 bg-green-800 text-white px-6 py-3 rounded-full shadow-lg text-center transition-all duration-300 ease-out transform z-[9999] ${
      visible 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 -translate-y-2'
    }`}>
      {message}
    </div>
  );
}