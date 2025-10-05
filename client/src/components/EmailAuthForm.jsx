import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

export function EmailAuthForm({ onLoginWithEmail, onRegisterWithEmail, isLoading, error }) {
  const [mode, setMode] = useState('login'); // 'login' o 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      onLoginWithEmail(email, password);
    } else {
      if (!displayName.trim()) {
        alert('Ingresa tu nombre');
        return;
      }
      onRegisterWithEmail(email, password, displayName);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
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
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              placeholder="Ej: Juan Pérez"
            />
          </div>
        )}
        
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
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
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
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                placeholder="••••••••"
              />
          {mode === 'register' && (
            <p className="text-xs text-neutral-400 mt-1">Mínimo 6 caracteres</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="primary"
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              {mode === 'login' ? 'Iniciando...' : 'Registrando...'}
            </span>
          ) : (
            mode === 'login' ? 'Iniciar sesión' : 'Registrarse'
          )}
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          disabled={isLoading}
          className="w-full text-sm text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
