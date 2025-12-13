import React from 'react';

export function Footer({ onOpenInstructions, onOpenFeedback, gameId, onLeaveGame, onCopyGameCode, isMobile }) {
  return (
    <footer className="w-full py-6 px-6 relative z-10">
      <div className="flex flex-col gap-4">
        {/* Botones globales (Reglas / Abandonar / Feedback) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {gameId && (
            <button
              onClick={onLeaveGame}
              className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-red-400 transition-colors duration-150"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Abandonar partida</span>
            </button>
          )}

          {gameId && (
            <button
              onClick={() => onCopyGameCode(gameId)}
              className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Código de partida: <span className="font-mono">{gameId}</span></span>
            </button>
          )}

          <button
            onClick={onOpenInstructions}
            className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Reglas del juego</span>
          </button>

          <button
            onClick={onOpenFeedback}
            className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>Enviar sugerencias</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

