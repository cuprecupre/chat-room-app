import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

export function EmailAuthModal({ isOpen, onClose, onLoginWithEmail, onRegisterWithEmail, isLoading, error }) {
  const [step, setStep] = useState('select'); // 'select' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleClose = () => {
    setStep('select');
    setEmail('');
    setPassword('');
    setDisplayName('');
    onClose();
  };

  const handleBack = () => {
    setStep('select');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    onLoginWithEmail(email, password);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('Ingresa tu nombre y apellido');
      return;
    }
    onRegisterWithEmail(email, password, displayName);
  };

  // Pantalla de selección
  if (step === 'select') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Acceder con Email">
        <div className="space-y-4">
          <p className="text-neutral-300 text-center mb-6">
            ¿Ya tienes una cuenta o quieres crear una nueva?
          </p>
          
          <Button
            onClick={() => setStep('login')}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Iniciar sesión
          </Button>
          
          <Button
            onClick={() => setStep('register')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Crear nueva cuenta
          </Button>
          
          <button
            onClick={handleClose}
            className="w-full text-sm text-neutral-400 hover:text-neutral-200 transition-colors py-2"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    );
  }

  // Formulario de Login
  if (step === 'login') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Iniciar sesión">
        <form onSubmit={handleLogin} className="space-y-4">
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
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
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
          </div>
        </form>
      </Modal>
    );
  }

  // Formulario de Registro
  if (step === 'register') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Crear cuenta">
        <form onSubmit={handleRegister} className="space-y-4">
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
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
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
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              placeholder="••••••••"
            />
            <p className="text-xs text-neutral-400 mt-1">Mínimo 6 caracteres</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  Creando...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  return null;
}
