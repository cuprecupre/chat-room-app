import React from 'react';

export function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container - Scrollable */}
      <div className="relative h-full overflow-y-auto flex items-start justify-center p-4 sm:py-8">
        {/* Modal Content */}
        <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 animate-scaleIn my-auto">
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Body - Scrollable */}
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
