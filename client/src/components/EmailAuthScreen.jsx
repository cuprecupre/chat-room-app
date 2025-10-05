import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import heroImg from '../assets/impostor-home.png';

export function EmailAuthScreen({ onLoginWithEmail, onRegisterWithEmail, onBack, isLoading, error, clearError }) {
  const [mode, setMode] = useState('select'); // 'select' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');
  const wasLoadingRef = useRef(false);
  const lastModeRef = useRef('select');

  // Mantener el modo activo cuando hay un error después de intentar login/registro
  useEffect(() => {
    // Si estábamos cargando y ahora hay un error, mantener el último modo activo
    if (wasLoadingRef.current && !isLoading && error && lastModeRef.current !== 'select') {
      console.log('⚠️ Error detectado, manteniendo modo:', lastModeRef.current);
      setMode(lastModeRef.current);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, error]);

  // Rastrear el modo actual
  useEffect(() => {
    if (mode !== 'select') {
      lastModeRef.current = mode;
    }
  }, [mode]);

  const handleBack = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setLocalError('');
    if (clearError) clearError();
    if (mode === 'select') {
      onBack();
    } else {
      setMode('select');
      lastModeRef.current = 'select';
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLocalError('');
    lastModeRef.current = 'login';
    onLoginWithEmail(email, password);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!displayName.trim()) {
      setLocalError('Por favor, ingresa tu nombre y apellido.');
      return;
    }
    lastModeRef.current = 'register';
    onRegisterWithEmail(email, password, displayName);
  };

  const displayError = localError || error;

  return (
    <div className="w-full h-dvh flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Header */}
          <div className="text-center space-y-4">
            <div className="perspective-1000 animate-scaleIn">
              <img 
                src={heroImg} 
                alt="El Impostor" 
                className="mx-auto w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10" 
                loading="lazy" 
              />
            </div>
            <h1 className="text-3xl font-bold text-neutral-50">
              {mode === 'select' && 'Acceder con Email'}
              {mode === 'login' && 'Iniciar sesión'}
              {mode === 'register' && 'Crear cuenta'}
            </h1>
          </div>

          {/* Pantalla de selección */}
          {mode === 'select' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-neutral-300 text-center">
                ¿Ya tienes una cuenta o quieres crear una nueva?
              </p>
              
              <Button
                onClick={() => {
                  setMode('login');
                  setLocalError('');
                  if (clearError) clearError();
                }}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Iniciar sesión
              </Button>
              
              <Button
                onClick={() => {
                  setMode('register');
                  setLocalError('');
                  if (clearError) clearError();
                }}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Crear nueva cuenta
              </Button>
            </div>
          )}

          {/* Formulario de Login */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              {displayError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {displayError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Iniciando...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          )}

          {/* Formulario de Registro */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-neutral-300 mb-2">
                  Nombre y Apellido
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label htmlFor="email-register" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  id="email-register"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password-register" className="block text-sm font-medium text-neutral-300 mb-2">
                  Contraseña
                </label>
                <input
                  id="password-register"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  placeholder="••••••••"
                />
                <p className="text-xs text-neutral-400 mt-1">Mínimo 6 caracteres</p>
              </div>

              {displayError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {displayError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </Button>
            </form>
          )}

          {/* Botón de volver */}
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver</span>
          </button>
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
