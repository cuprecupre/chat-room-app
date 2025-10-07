import React from 'react';

export function Footer({ onOpenInstructions }) {
  return (
    <footer className="w-full py-4 px-6">
      <div className="flex items-center justify-center">
        <button
          onClick={onOpenInstructions}
          className="inline-flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Aprende a jugar</span>
        </button>
      </div>
    </footer>
  );
}

