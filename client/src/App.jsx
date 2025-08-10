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

  const { connected, state, emit } = useSocket(user);

  const isHost = useMemo(() => state && user && state.hostId === user.uid, [state, user]);

  const createGame = useCallback(() => emit('create-game'), [emit]);
  const joinGame = useCallback((gameId) => emit('join-game', gameId), [emit]);
  const startGame = useCallback(() => emit('start-game', state?.gameId), [emit, state]);
  const endGame = useCallback(() => emit('end-game', state?.gameId), [emit, state]);
  const playAgain = useCallback(() => emit('play-again', state?.gameId), [emit, state]);
  const leaveGame = useCallback(() => {
    if (state?.gameId) {
      emit('leave-game', state.gameId);
    }
  }, [emit, state]);

  const copyLink = useCallback(async () => {
    if (!state?.gameId) return;
    const url = `${window.location.origin}?gameId=${state.gameId}`;
    await navigator.clipboard.writeText(url);
    window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Enlace copiado' }));
  }, [state]);

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

    if (state?.gameId) {
      return (
        <GameRoom 
          state={state} 
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
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Toaster />
       <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {user && connected && (
          <header className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
            <h1 className="text-2xl sm:text-3xl font-bold text-violet-400">El Impostor v1.1</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-sm sm:text-base font-medium hidden sm:inline">{user.displayName}</span>
              <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm">
                Salir
              </button>
            </div>
          </header>
        )}
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
