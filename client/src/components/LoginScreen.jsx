import React, { useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import heroImg from '../assets/impostor-home.png';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '706542941882-483ctnm99nl51g174gj09srt1m7rmogd.apps.googleusercontent.com';

export function LoginScreen({ onLogin, onGoToEmailAuth, isLoading, onOpenInstructions, onOpenFeedback }) {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Inicializar y renderizar el botón de Google Identity Services
  useEffect(() => {
    const initGoogleButton = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        console.log('🔧 Inicializando Google Identity Services...');

        // Inicializar GIS con redirect mode
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'redirect',
          login_uri: `${window.location.origin}/auth/google`,
        });

        // Renderizar el botón de Google
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 300,
        });

        console.log('✅ Botón de Google renderizado');
      }
    };

    // Si GIS ya está cargado, inicializar inmediatamente
    if (window.google?.accounts?.id) {
      initGoogleButton();
    } else {
      // Si no, esperar a que se cargue
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGoogleButton();
        }
      }, 100);

      // Limpiar después de 10 segundos si no se carga
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4 sm:space-y-6">
          <div className="perspective-1000 animate-scaleIn animate-delay-200">
            <img src={heroImg} alt="El Impostor" className="mx-auto w-56 h-56 rounded-full object-cover shadow-xl ring-1 ring-white/10 animate-tilt-oscillate" loading="lazy" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-neutral-50 animate-fadeIn animate-delay-500">El impostor</h1>
          <p className="text-lg sm:text-xl text-neutral-300 animate-fadeIn animate-delay-600">Alguien no dice la verdad.<br />¿Lo vas a descubrir?</p>

          {/* Botón de Google renderizado por GIS */}
          <div className="animate-fadeIn animate-delay-800 flex justify-center">
            <div ref={googleButtonRef} className="min-h-[44px]">
              {/* El botón de Google se renderiza aquí por GIS */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <Spinner size="sm" />
                  <span className="text-neutral-300">Conectando...</span>
                </div>
              )}
            </div>
          </div>

          <div className="animate-fadeIn animate-delay-900">
            <Button
              onClick={onGoToEmailAuth}
              disabled={isLoading}
              variant="outline"
              size="md"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <span className="mr-3 inline-flex items-center justify-center align-middle">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="align-middle">Continuar con Email</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fadeIn animate-delay-1000">
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
