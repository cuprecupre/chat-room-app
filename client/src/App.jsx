import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { LoginScreen } from './components/LoginScreen';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Toaster } from './components/Toaster';

export default function App() {
  const { user, loading, error, login, logout } = useAuth();
  const [token, setToken] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setToken);
    } else {
      setToken(null);
    }
  }, [user]);

  const { connected, gameState, emit } = useSocket(user);

  const isHost = useMemo(() => gameState && user && gameState.hostId === user.uid, [gameState, user]);

  const createGame = useCallback(() => emit('create-game'), [emit]);
  const joinGame = useCallback((gameId) => emit('join-game', gameId), [emit]);
  const startGame = useCallback(() => emit('start-game', gameState?.gameId), [emit, gameState]);
  const endGame = useCallback(() => emit('end-game', gameState?.gameId), [emit, gameState]);
  const playAgain = useCallback(() => emit('play-again', gameState?.gameId), [emit, gameState]);
  const leaveGame = useCallback(() => {
    if (gameState?.gameId) {
      // Remove gameId from URL BEFORE leaving to avoid auto-rejoin via useSocket resume logic
      const url = new URL(window.location);
      if (url.searchParams.get('gameId') === gameState.gameId) {
        url.searchParams.delete('gameId');
        window.history.replaceState({}, '', url.toString());
      }
      emit('leave-game', gameState.gameId);
    }
  }, [emit, gameState]);

  const copyLink = useCallback(async () => {
    if (!gameState?.gameId) return;
    const url = `${window.location.origin}?gameId=${gameState.gameId}`;
    await navigator.clipboard.writeText(url);
    window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Enlace copiado' }));
  }, [gameState]);

  const handleLogout = useCallback(async () => {
    try {
      // useSocket hook handles emitting leave-game on disconnect
      await logout();
    } catch (e) {
      console.error("Error during logout:", e);
    }
  }, [logout]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Autenticando...</p>
      </div>
    );
  }

  if (user && !connected) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Conectando al servidor...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
       return <LoginScreen onLogin={login} error={error} />;
    }
    if (!user) {
      return <LoginScreen onLogin={login} error={error} />;
    }

    if (gameState?.gameId) {
      return (
        <GameRoom 
          state={gameState} 
          isHost={isHost} 
          user={user} 
          onStartGame={startGame}
          onEndGame={endGame}
          onPlayAgain={playAgain}
          onLeaveGame={leaveGame}
          onCopyLink={copyLink}
        />
      );
    }

    return <Lobby user={user} onCreateGame={createGame} onJoinGame={joinGame} onLogout={handleLogout} />;
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen font-sans">
      <Toaster />
       <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {user && connected && (
          <header className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
            <h1 className="text-2xl sm:text-3xl font-bold text-violet-400">El Impostor</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-sm sm:text-base font-medium hidden sm:inline">{user.displayName}</span>
              <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
              <div className="relative">
                <button
                  aria-label="Abrir menú de configuración"
                  onClick={() => setMenuOpen(v => !v)}
                  className="p-2 rounded-md hover:bg-white/10 text-gray-300 hover:text-white"
                >
                  {/* Ícono engranaje */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M11.983 1.574a1 1 0 0 0-1.966 0l-.107.6a7.967 7.967 0 0 0-1.698.986l-.537-.31a1 1 0 0 0-1.366.366l-.983 1.703a1 1 0 0 0 .366 1.366l.536.31a7.97 7.97 0 0 0-.001 1.975l-.535.309a1 1 0 0 0-.366 1.366l.983 1.703a1 1 0 0 0 1.366.366l.537-.31c.53.404 1.099.737 1.698.986l.107.6a1 1 0 0 0 1.966 0l.107-.6c.599-.249 1.168-.582 1.698-.986l.537.31a1 1 0 0 0 1.366-.366l.983-1.703a1 1 0 0 0-.366-1.366l-.536-.309a7.97 7.97 0 0 0 0-1.975l.536-.31a1 1 0 0 0 .366-1.366l-.983-1.703a1 1 0 0 0-1.366-.366l-.537.31a7.967 7.967 0 0 0-1.698-.986l-.107-.6ZM10 12.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border border-white/10 bg-gray-800 shadow-lg py-1 z-10">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}
        <main>
          {renderContent()}
        </main>
        {/* Footer sin enlace de cierre de sesión (migrado al dropdown de la cabecera) */}
      </div>
    </div>
  );
}
