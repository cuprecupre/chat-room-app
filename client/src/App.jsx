import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useAppAssetsPreloader } from './hooks/useImagePreloader';
import { LoginScreen } from './components/LoginScreen';
import { EmailAuthScreen } from './components/EmailAuthScreen';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Toaster } from './components/Toaster';
import { Spinner } from './components/ui/Spinner';
import { Button } from './components/ui/Button';
import { Footer } from './components/Footer';
import { InstructionsModal } from './components/InstructionsModal';
import { UIShowcase } from './components/UIShowcase';
import { Avatar } from './components/ui/Avatar';
import bellImg from './assets/bell.png';
import heroImg from './assets/impostor-home.png';

export default function App() {
  const { user, loading, error, login, loginWithEmail, registerWithEmail, logout, clearError } = useAuth();
  const [token, setToken] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
  
  // Restaurar estado de EmailAuthScreen si había un intento de login/registro en curso
  // Usar función lazy initializer para ejecutar solo en el primer render
  const [showEmailAuthScreen, setShowEmailAuthScreen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('emailAuth:state');
      if (saved && !user) {
        // Hay estado guardado y no hay usuario autenticado
        return true;
      } else if (saved && user) {
        // Si hay usuario autenticado pero quedó estado guardado, limpiarlo
        sessionStorage.removeItem('emailAuth:state');
      }
    } catch (err) {
      console.error('Error verificando estado de auth:', err);
    }
    return false;
  });
  
  // Check if user is accessing showcase route
  const isShowcaseRoute = window.location.pathname === '/ui-showcase';
  
  // Precargar assets de la app
  const { isLoading: assetsLoading } = useAppAssetsPreloader();
  const menuRef = useRef(null);
  const lastLoggedUid = useRef(null); // Para evitar logs duplicados
  const hasLoggedNoUser = useRef(false); // Para evitar log infinito de "no hay usuario"
  const hasLoggedLoading = useRef(false); // Para evitar log infinito de loading

  useEffect(() => {
    if (user) {
      user.getIdToken().then((token) => {
        setToken(token);
      }).catch((err) => {
        console.error('Error obteniendo token:', err);
        setToken(null);
      });
      // Cerrar pantalla de email auth cuando el usuario se autentica
      setShowEmailAuthScreen(false);
      // Limpiar estado persistido de autenticación con email
      sessionStorage.removeItem('emailAuth:state');
    } else {
      setToken(null);
    }
  }, [user?.uid]); // Solo re-ejecutar si cambia el UID, no el objeto completo

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

  const handleTitleClick = useCallback(() => {
    // Si está en una partida (lobby o jugando), mostrar modal de confirmación
    if (gameState?.gameId) {
      setShowLeaveGameModal(true);
    } else {
      // Si no está en partida, ir directamente al home
      window.location.href = '/';
    }
  }, [gameState]);

  const isMobile = useMemo(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  const copyLink = useCallback(async () => {
    if (!gameState?.gameId) return;
    const url = `${window.location.origin}?gameId=${gameState.gameId}`;
    
    // En móvil, usar la API de compartir nativa (requiere HTTPS en producción)
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'Únete a mi juego de El Impostor',
          url: url
        });
        return;
      } catch (err) {
        // Si el usuario cancela, no hacer nada
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error sharing:', err);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: 'No se pudo compartir' }));
        return;
      }
    }
    
    // En desktop o móvil sin Web Share, copiar al portapapeles
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Enlace copiado' }));
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Enlace copiado' }));
        }
      }
    } catch (err) {
      console.error('Error copying:', err);
    }
  }, [gameState, isMobile]);

  const copyGameCode = useCallback(async () => {
    if (!gameState?.gameId) return;
    
    // En móvil, usar la API de compartir nativa (requiere HTTPS en producción)
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'Código de sala - El Impostor',
          text: `Código de sala: ${gameState.gameId}`
        });
        return;
      } catch (err) {
        // Si el usuario cancela, no hacer nada
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error sharing:', err);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: 'No se pudo compartir' }));
        return;
      }
    }
    
    // En desktop o móvil sin Web Share, copiar al portapapeles
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(gameState.gameId);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Código copiado' }));
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = gameState.gameId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Código copiado' }));
        }
      }
    } catch (err) {
      console.error('Error copying:', err);
    }
  }, [gameState, isMobile]);

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
    if (!hasLoggedLoading.current) {
      console.log('⏳ App - Cargando autenticación...');
      hasLoggedLoading.current = true;
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
              <p>Autenticando</p>
              <p className="text-sm text-neutral-400 mt-1">Verificando sesión...</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Reset flag cuando termina de cargar
    hasLoggedLoading.current = false;
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
              <p className="text-neutral-400">No se puede conectar al servidor. Esto puede deberse a problemas de red o el servidor está inactivo.</p>
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
              <p className="text-sm text-neutral-400 mt-1">Estableciendo conexión...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Mostrar pantalla de autenticación con email si está activada
    if (showEmailAuthScreen && !user) {
      return (
        <EmailAuthScreen
          onLoginWithEmail={loginWithEmail}
          onRegisterWithEmail={registerWithEmail}
          onBack={() => {
            setShowEmailAuthScreen(false);
            clearError();
          }}
          isLoading={loading}
          error={error}
          clearError={clearError}
        />
      );
    }

    // Handle showcase route with access control
    if (isShowcaseRoute) {
      if (!user) {
        return <LoginScreen onLogin={login} onGoToEmailAuth={() => setShowEmailAuthScreen(true)} isLoading={loading} onOpenInstructions={() => setInstructionsOpen(false)} />;
      }
      
      // Check if user is authorized (only leandrovegasb@gmail.com)
      if (user.email !== 'leandrovegasb@gmail.com') {
        return (
          <div className="w-full h-screen flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-4">
              <h1 className="text-3xl font-bold text-red-400">Acceso Denegado</h1>
              <p className="text-neutral-400">No tienes permisos para acceder a esta página.</p>
              <Button onClick={() => window.location.href = '/'}>Volver al inicio</Button>
            </div>
          </div>
        );
      }
      
      return <UIShowcase />;
    }
    
    // Detect URL vs session mismatch and provide safe recovery UI
    const url = new URL(window.location);
    const urlGameId = url.searchParams.get('gameId');

    if (error) {
      if (!hasLoggedNoUser.current) {
        console.log('❌ App - Error de autenticación:', error);
        hasLoggedNoUser.current = true;
      }
      return <LoginScreen onLogin={login} onGoToEmailAuth={() => setShowEmailAuthScreen(true)} isLoading={loading} onOpenInstructions={() => setInstructionsOpen(true)} />;
    }
    if (!user) {
      if (!hasLoggedNoUser.current) {
        console.log('🚫 App - Sin usuario autenticado, mostrando login');
        hasLoggedNoUser.current = true;
      }
      return <LoginScreen onLogin={login} onGoToEmailAuth={() => setShowEmailAuthScreen(true)} isLoading={loading} onOpenInstructions={() => setInstructionsOpen(true)} />;
    }
    
    // Usuario autenticado - resetear flag de "no user" y loguear si es un usuario nuevo
    hasLoggedNoUser.current = false;
    if (lastLoggedUid.current !== user.uid) {
      console.log('✅ App - Usuario autenticado:', {
        displayName: user.displayName,
        email: user.email,
        uid: user.uid,
      });
      lastLoggedUid.current = user.uid;
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
              <p className="text-neutral-400">
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
          <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
            <div className="flex justify-center">
              <img 
                src={bellImg} 
                alt="Advertencia" 
                className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-400/30 shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-50 mb-3">Unirse a sala</h2>
              <p className="text-sm text-neutral-400">
                ¿Quieres unirte a la sala <span className="font-mono font-semibold text-neutral-300">{urlGameId}</span>?
              </p>
            </div>
            <div className="space-y-3">
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
          isMobile={isMobile}
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
            <button 
              onClick={handleTitleClick}
              className="text-xl sm:text-2xl font-bold text-neutral-50 hover:text-orange-400 transition-colors active:scale-95 cursor-pointer"
              style={{fontFamily: 'Trocchi, serif'}}
            >
              El impostor
            </button>
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
                  <Avatar
                    photoURL={user.photoURL}
                    displayName={user.displayName}
                    size="md"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-950/95 backdrop-blur-md shadow-2xl ring-1 ring-white/10 p-2 z-20">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-neutral-200 truncate">{user.displayName}</p>
                      {user.email && <p className="text-xs text-neutral-400 truncate">{user.email}</p>}
                    </div>
                    <div className="my-1 h-px bg-white/10" />
                    {user.email === 'leandrovegasb@gmail.com' && (
                      <>
                        <button
                          onClick={() => {
                            window.location.href = '/ui-showcase';
                            setMenuOpen(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-neutral-200 hover:text-white hover:bg-white/10 rounded-md"
                        >
                          UI Showcase
                        </button>
                        <div className="my-1 h-px bg-white/10" />
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-neutral-200 hover:text-white hover:bg-white/10 rounded-md"
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

      {/* Modal de confirmación para abandonar juego */}
      {showLeaveGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 rounded-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-neutral-50">¿Abandonar la partida?</h3>
              <p className="text-neutral-400">Si abandonas, perderás tu progreso en esta partida.</p>
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => {
                    setShowLeaveGameModal(false);
                    leaveGame();
                  }}
                  variant="danger"
                >
                  Sí, abandonar
                </Button>
                <Button
                  onClick={() => setShowLeaveGameModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
