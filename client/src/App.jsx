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
            </div>
          </header>
        )}
        <main>
          {renderContent()}
        </main>
        {user && connected && (
          <footer className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-400 font-semibold underline underline-offset-4"
            >
              Cerrar sesión
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
