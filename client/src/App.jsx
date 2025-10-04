import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useAppAssetsPreloader } from './hooks/useImagePreloader';
import { LoginScreen } from './components/LoginScreen';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Toaster } from './components/Toaster';
import { Spinner } from './components/ui/Spinner';
import { Button } from './components/ui/Button';
import { Footer } from './components/Footer';
import { InstructionsModal } from './components/InstructionsModal';
import bellImg from './assets/bell.png';
import heroImg from './assets/impostor-home.png';

export default function App() {
  const { user, loading, error, login, logout } = useAuth();
  const [token, setToken] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  
  // Precargar assets de la app
  const { isLoading: assetsLoading } = useAppAssetsPreloader();
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setToken);
    } else {
      setToken(null);
    }
  }, [user]);

  const { connected, gameState, emit } = useSocket(user);
  const [isStuck, setIsStuck] = useState(false);
  
  // Detect when app is stuck (no connection for 10 seconds)
  useEffect(() => {
    if (user && !connected) {
      const timer = setTimeout(() => {
        setIsStuck(true);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    } else {
      setIsStuck(false);
    }
  }, [user, connected]);
  
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
      
      // Force page reload to clear all state and return to clean lobby
      setTimeout(() => {
        window.location.reload();
      }, 100); // Small delay to ensure the leave-game event is processed
    }
  }, [emit, gameState]);

  const copyToClipboard = useCallback(async (text, successMessage) => {
    try {
      // Intentar con la API moderna primero
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: successMessage }));
        return;
      }
      
      // Fallback para Safari mobile y otros navegadores
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: successMessage }));
      } else {
        // Si falla, mostrar el texto para que el usuario lo copie manualmente
        window.dispatchEvent(new CustomEvent('app:toast', { detail: `Texto: ${text}` }));
      }
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Mostrar el texto como fallback
      window.dispatchEvent(new CustomEvent('app:toast', { detail: `Texto: ${text}` }));
    }
  }, []);

  const copyLink = useCallback(async () => {
    if (!gameState?.gameId) return;
    const url = `${window.location.origin}?gameId=${gameState.gameId}`;
    await copyToClipboard(url, 'Enlace copiado');
  }, [gameState, copyToClipboard]);

  const copyGameCode = useCallback(async () => {
    if (!gameState?.gameId) return;
    await copyToClipboard(gameState.gameId, 'Código copiado');
  }, [gameState, copyToClipboard]);

  const castVote = useCallback((targetId) => {
    if (!gameState?.gameId) return;
    emit('cast-vote', { gameId: gameState.gameId, targetId });
  }, [emit, gameState]);

  const handleLogout = useCallback(async () => {
    try {
      // Close dropdown first
      setMenuOpen(false);
      
      // Clear URL parameters before logout
      const url = new URL(window.location);
      url.searchParams.delete('gameId');
      window.history.replaceState({}, '', url.toString());
      
      // Leave game if in one
      if (gameState?.gameId) {
        emit('leave-game', gameState.gameId);
      }
      
      // useSocket hook handles emitting leave-game on disconnect
      await logout();
      
      // Force page reload to clear all state
      window.location.reload();
    } catch (e) {
      console.error("Error during logout:", e);
    }
  }, [logout, emit, gameState]);

  const forceExit = useCallback(() => {
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('gameId');
    window.history.replaceState({}, '', url.toString());
    
    // Force disconnect and clear state
    if (gameState?.gameId) {
      emit('leave-game', gameState.gameId);
    }
    
    // Show toast
    window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Sesión reiniciada. Vuelve al lobby.' }));
    
    // Force page reload to clear all state
    window.location.reload();
  }, [emit, gameState]);

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
        <div className="flex flex-col items-center gap-6 text-center">
          <img 
            src={heroImg} 
            alt="El Impostor" 
            className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10" 
          />
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <div>
              <p>Autenticando</p>
              <p className="text-sm text-gray-400 mt-1">Verificando sesión...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && !connected) {
    if (isStuck) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="w-full max-w-sm mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <img 
              src={bellImg} 
              alt="Advertencia" 
              className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-400/30 shadow-lg"
            />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-neutral-50 mb-2">Conexión perdida</h2>
              <p className="text-gray-400">No se puede conectar al servidor. Esto puede deberse a problemas de red o el servidor está inactivo.</p>
            </div>
            <div className="space-y-3 px-6">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
              >
                Reintentar conexión
              </Button>
              <Button
                onClick={forceExit}
                variant="outline"
              >
                Forzar salida
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-6 text-center">
          <img 
            src={heroImg} 
            alt="El Impostor" 
            className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10" 
          />
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <div>
              <p>Conectando al servidor</p>
              <p className="text-sm text-gray-400 mt-1">Estableciendo conexión...</p>
            </div>
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
       return <LoginScreen onLogin={login} error={error} onOpenInstructions={() => setInstructionsOpen(true)} />;
    }
    if (!user) {
      return <LoginScreen onLogin={login} error={error} onOpenInstructions={() => setInstructionsOpen(true)} />;
    }

    // Case 1: URL has a gameId but session is in another game → offer switch
    if (urlGameId && gameState?.gameId && urlGameId !== gameState.gameId) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-neutral-950 text-white">
          <div className="w-full max-w-sm mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <img 
                src={bellImg} 
                alt="Advertencia" 
                className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-400/30 shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-50 mb-2">¿Cambiar de sala?</h2>
              <p className="text-gray-400">
                Estás en la sala <span className="font-mono font-semibold text-neutral-300">{gameState.gameId}</span>, pero la URL apunta a <span className="font-mono font-semibold text-neutral-300">{urlGameId}</span>.
              </p>
            </div>
            <div className="space-y-3 px-6">
              <Button
                onClick={() => emit('join-game', urlGameId)}
                variant="primary"
                size="md"
              >
                Cambiarme a {urlGameId}
              </Button>
              <Button
                onClick={() => { url.searchParams.delete('gameId'); window.history.replaceState({}, '', url.toString()); window.dispatchEvent(new Event('popstate')); }}
                variant="outline"
                size="md"
              >
                Mantenerme en {gameState.gameId}
              </Button>
              <Button
                onClick={forceExit}
                variant="outline"
                size="md"
                className="border-orange-500/30 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
              >
                Forzar salida
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Case 2: URL has a gameId but session is not attached → allow joining or clearing
    if (urlGameId && !gameState?.gameId) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-neutral-950 text-white">
          <div className="w-full max-w-sm mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <img 
                src={bellImg} 
                alt="Advertencia" 
                className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-400/30 shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-50 mb-2">Unirse a sala</h2>
              <p className="text-gray-400">
                ¿Quieres unirte a la sala <span className="font-mono font-semibold text-neutral-300">{urlGameId}</span>?
              </p>
            </div>
            <div className="space-y-3 px-6">
              <Button
                onClick={() => emit('join-game', urlGameId)}
                variant="primary"
                size="md"
              >
                Unirme ahora
              </Button>
              <Button
                onClick={() => { url.searchParams.delete('gameId'); window.history.replaceState({}, '', url.toString()); window.dispatchEvent(new Event('popstate')); }}
                variant="outline"
                size="md"
              >
                Volver al lobby
              </Button>
              <Button
                onClick={forceExit}
                variant="outline"
                size="md"
                className="border-orange-500/30 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
              >
                Forzar salida
              </Button>
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
          onVote={castVote}
        />
      );
    }

    return <Lobby user={user} onCreateGame={createGame} onJoinGame={joinGame} onLogout={handleLogout} />;
  };

  const showHeader = user && connected;
  const containerClasses = showHeader
    ? "w-full max-w-4xl mx-auto p-6 sm:p-6 lg:p-8"
    : "w-full max-w-4xl mx-auto min-h-dvh flex items-center justify-center p-0";

  return (
    <div className="bg-neutral-950 text-white min-h-screen font-sans flex flex-col">
      <Toaster />
      <InstructionsModal isOpen={instructionsOpen} onClose={() => setInstructionsOpen(false)} />
      
      <div className={containerClasses}>
        {showHeader && (
          <header className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-50">El impostor</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-sm sm:text-base font-medium hidden sm:inline flex items-center">{user.displayName}</span>
              <div className="relative" ref={menuRef}>
                <button
                  aria-label="Abrir menú de usuario"
                  onClick={() => setMenuOpen(v => !v)}
                  className="relative group rounded-full ring-1 ring-transparent focus:outline-none active:scale-95 transition-all duration-150"
                  style={{ 
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                >
                  <div className="relative">
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover block" 
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
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <main>
          {renderContent()}
        </main>
      </div>
      
      {user && connected && <Footer onOpenInstructions={() => setInstructionsOpen(true)} />}
    </div>
  );
}
