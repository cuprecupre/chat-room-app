import React from 'react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import heroImg from '../assets/impostor-home.png';

export function LoginScreen({ onLogin, error, isLoading, onOpenInstructions }) {
  return (
    <div className="w-full h-dvh flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4 sm:space-y-6">
          <div className="perspective-1000 animate-scaleIn animate-delay-200">
            <img src={heroImg} alt="El Impostor" className="mx-auto w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full object-cover shadow-xl ring-1 ring-white/10 animate-tilt-oscillate" loading="lazy" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-50 animate-fadeIn animate-delay-500">El impostor</h1>
          <p className="text-lg sm:text-xl text-gray-300 animate-fadeIn animate-delay-600">Alguien no dice la verdad.<br />¿Lo vas a descubrir?</p>

          <div className="animate-fadeIn animate-delay-800">
            <Button 
              onClick={onLogin} 
              disabled={isLoading}
              variant="outline"
              size="md"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
            <span className="mr-3 inline-flex items-center justify-center align-middle">
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_643_9687)">
                  <path d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z" fill="#EA4335"/>
                  <path d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z" fill="#4285F4"/>
                  <path d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z" fill="#FBBC05"/>
                  <path d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z" fill="#34A853"/>
                </g>
                <defs>
                  <clipPath id="clip0_643_9687">
                    <rect width="16" height="16" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              )}
            </span>
            <span className="align-middle">{isLoading ? 'Conectando...' : 'Continuar con Google'}</span>
            </Button>
          </div>

          <button
            onClick={onOpenInstructions}
            className="inline-flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors duration-150 animate-fadeIn animate-delay-1000"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Cómo jugar</span>
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4 text-red-400">
              <p className="font-semibold text-sm sm:text-base">Error al iniciar sesión:</p>
              <p className="text-xs sm:text-sm mt-1">{error.message || error}</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="w-full py-4 px-6">
        <div className="flex items-center justify-center">
          <p className="text-xs sm:text-sm text-neutral-500">
            © 2025 El impostor. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
