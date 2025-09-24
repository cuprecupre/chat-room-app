import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { LoginScreen } from './components/LoginScreen';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Toaster } from './components/Toaster';
import { Spinner } from './components/ui/Spinner';

export default function App() {
  const { user, loading, error, login, logout } = useAuth();
  const [token, setToken] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setToken);
    } else {
      setToken(null);
    }
  }, [user]);

  const { connected, gameState, emit } = useSocket(user);
  const getUrlGameId = () => {
    try {
      return new URL(window.location).searchParams.get('gameId');
    } catch (_) { return null; }
  };

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

  const copyGameCode = useCallback(async () => {
    if (!gameState?.gameId) return;
    await navigator.clipboard.writeText(gameState.gameId);
    window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Código copiado' }));
  }, [gameState]);

  const handleLogout = useCallback(async () => {
    try {
      // Close dropdown first
      setMenuOpen(false);
      // useSocket hook handles emitting leave-game on disconnect
      await logout();
    } catch (e) {
      console.error("Error during logout:", e);
    }
  }, [logout]);
  // Minimal recovery bar: always show controls if URL has gameId but no session
  const urlGameId = getUrlGameId();
  const RecoveryBar = () => {
    if (!urlGameId || gameState?.gameId) return null;
    return (
      <div className="w-full max-w-sm mx-auto mb-4">
        <div className="rounded-xl p-3 bg-white/5 ring-1 ring-white/10 text-center">
          <p className="text-sm text-neutral-300">Tienes una sala en la URL: <span className="font-mono">{urlGameId}</span></p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onClick={() => emit('join-game', urlGameId)} className="inline-flex items-center justify-center rounded-md h-10 text-sm text-neutral-200 border border-neutral-500 hover:bg-white/10">Unirme</button>
            <button onClick={() => emit('get-state')} className="inline-flex items-center justify-center rounded-md h-10 text-sm text-neutral-200 border border-neutral-500 hover:bg-white/10">Reintentar</button>
            <button onClick={() => { const url=new URL(window.location); url.searchParams.delete('gameId'); window.history.replaceState({}, '', url.toString()); window.dispatchEvent(new Event('popstate')); }} className="inline-flex items-center justify-center rounded-md h-10 text-sm text-neutral-400 hover:text-neutral-300">Volver al lobby</button>
          </div>
        </div>
      </div>
    );
  };

  // Cerrar dropdown al hacer click fuera o al presionar Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner size="md" />
          <div>
            <p>Autenticando...</p>
            <p className="text-sm text-gray-400 mt-1">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (user && !connected) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner size="md" />
          <div>
            <p>Conectando al servidor...</p>
            <p className="text-sm text-gray-400 mt-1">Estableciendo conexión...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Detect URL vs session mismatch and provide safe recovery UI
    const url = new URL(window.location);
    const urlGameId = url.searchParams.get('gameId');

    if (error) {
       return <LoginScreen onLogin={login} error={error} />;
    }
    if (!user) {
      return <LoginScreen onLogin={login} error={error} />;
    }

    // Case 1: URL has a gameId but session is in another game → offer switch
    if (urlGameId && gameState?.gameId && urlGameId !== gameState.gameId) {
      return (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <div className="rounded-xl p-6 bg-gradient-to-b from-white/10 to-white/5 ring-1 ring-white/10 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-50">¿Cambiar de sala?</h3>
            <p className="text-sm text-neutral-300 mt-2">
              Estás en la sala <span className="font-mono">{gameState.gameId}</span>,
              pero la URL apunta a <span className="font-mono">{urlGameId}</span>.
            </p>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => emit('join-game', urlGameId)}
                className="w-full inline-flex items-center justify-center rounded-md font-semibold transition-colors h-11 text-base text-neutral-200 border border-neutral-500 hover:bg-white/10"
              >
                Cambiarme a {urlGameId}
              </button>
              <button
                onClick={() => { url.searchParams.delete('gameId'); window.history.replaceState({}, '', url.toString()); window.dispatchEvent(new Event('popstate')); }}
                className="w-full inline-flex items-center justify-center rounded-md font-semibold transition-colors h-11 text-base text-neutral-400 hover:text-neutral-300"
              >
                Mantenerme en {gameState.gameId}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Case 2: URL has a gameId but session is not attached → allow joining or clearing
    if (urlGameId && !gameState?.gameId) {
      return (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <div className="rounded-xl p-6 bg-gradient-to-b from-white/10 to-white/5 ring-1 ring-white/10 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-50">Unirse a sala</h3>
            <p className="text-sm text-neutral-300 mt-2">¿Quieres unirte a la sala <span className="font-mono">{urlGameId}</span>?</p>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => emit('join-game', urlGameId)}
                className="w-full inline-flex items-center justify-center rounded-md font-semibold transition-colors h-11 text-base text-neutral-200 border border-neutral-500 hover:bg-white/10"
              >
                Unirme ahora
              </button>
              <button
                onClick={() => { url.searchParams.delete('gameId'); window.history.replaceState({}, '', url.toString()); window.dispatchEvent(new Event('popstate')); }}
                className="w-full inline-flex items-center justify-center rounded-md font-semibold transition-colors h-11 text-base text-neutral-400 hover:text-neutral-300"
              >
                Volver al lobby
              </button>
              <button
                onClick={() => emit('get-state')}
                className="w-full inline-flex items-center justify-center rounded-md font-semibold transition-colors h-11 text-base text-neutral-400 hover:text-neutral-300"
              >
                Reintentar sincronización
              </button>
            </div>
          </div>
        </div>
      );
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
          onCopyGameCode={copyGameCode}
        />
      );
    }

    return <Lobby user={user} onCreateGame={createGame} onJoinGame={joinGame} onLogout={handleLogout} />;
  };

  const showHeader = user && connected;
  const containerClasses = showHeader
    ? "w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
    : "w-full max-w-4xl mx-auto min-h-dvh flex items-center justify-center p-0";

  return (
    <div className="bg-neutral-950 text-white min-h-screen font-sans">
      <Toaster />
       <div className={containerClasses}>
        {showHeader && (
          <header className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-50">El impostor</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-sm sm:text-base font-medium hidden sm:inline">{user.displayName}</span>
              <div className="relative" ref={menuRef}>
                <button
                  aria-label="Abrir menú de usuario"
                  onClick={() => setMenuOpen(v => !v)}
                  className="relative group rounded-full ring-1 ring-transparent hover:ring-white/20 focus:outline-none"
                >
                  <div className="relative">
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" 
                      onError={(e) => {
                        console.log('❌ Error cargando imagen del header:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={(e) => {
                        e.target.nextSibling.style.display = 'none';
                      }}
                    />
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-600 flex items-center justify-center text-white text-xs font-semibold"
                      style={{ display: 'none' }}
                    >
                      {user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 group-active:bg-white/20 transition-opacity" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-md shadow-2xl ring-1 ring-white/10 p-2 z-20">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-200 truncate">{user.displayName}</p>
                      {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                    </div>
                    <div className="my-1 h-px bg-white/10" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-md"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}
        {showHeader && <RecoveryBar />}
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
