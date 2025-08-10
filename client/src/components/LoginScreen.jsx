import React from 'react';

function Screen({ children }) {
  return <div className="w-full max-w-md mx-auto p-4 min-h-screen flex flex-col justify-center">{children}</div>;
}

export function LoginScreen({ onLogin, error, isLoading }) {
  return (
    <Screen>
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-violet-400">El Impostor</h1>
        <p className="text-xl text-gray-300">Descubre quién miente. ¿Estás listo para el desafío?</p>
        <button 
          onClick={onLogin} 
          disabled={isLoading}
          className="w-full h-12 inline-flex items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-700 font-semibold text-lg disabled:bg-violet-800 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-3" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 56.5l-63.8 63.8C324.5 99.8 288.7 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 406.5 248 406.5c93.9 0 134.4-66.3 138.6-100.3h-138.6v-83.3h238.9c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
          {isLoading ? 'Conectando...' : 'Entrar con Google'}
        </button>
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
            <p className="font-semibold">Error al iniciar sesión:</p>
            <p className="text-sm mt-1">{error.message || error}</p>
          </div>
        )}
      </div>
    </Screen>
  );
}
