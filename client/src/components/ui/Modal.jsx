import React from 'react';

export function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 animate-scaleIn">
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        )}
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
