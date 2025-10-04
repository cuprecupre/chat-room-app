import React, { useEffect, useRef } from 'react';
import { Button } from './ui/Button';

export function CopyModal({ isOpen, onClose, text, title }) {
  const textRef = useRef(null);

  useEffect(() => {
    if (isOpen && textRef.current) {
      // Seleccionar el texto automáticamente cuando se abre el modal
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 rounded-xl p-6 mx-4 max-w-sm w-full border border-neutral-700">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-neutral-50">{title}</h3>
          <p className="text-neutral-400 text-sm">
            Mantén presionado el texto para copiarlo
          </p>
          
          {/* Texto seleccionable */}
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <p 
              ref={textRef}
              className="text-orange-400 font-mono text-base break-all select-all"
              style={{ userSelect: 'all', WebkitUserSelect: 'all' }}
            >
              {text}
            </p>
          </div>
          
          <Button onClick={onClose} variant="primary" size="md" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

