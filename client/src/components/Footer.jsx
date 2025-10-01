import React from 'react';

export function Footer({ onOpenInstructions }) {
  return (
    <footer className="w-full max-w-4xl mx-auto mt-8 pt-6 pb-6 px-6 border-t border-white/10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-neutral-500">
          © 2025 El impostor. Todos los derechos reservados.
        </p>
        <button
          onClick={onOpenInstructions}
          className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors duration-150 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Cómo jugar</span>
        </button>
      </div>
    </footer>
  );
}

