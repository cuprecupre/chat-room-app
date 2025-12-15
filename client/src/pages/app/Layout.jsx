/**
 * App Layout (Private)
 * 
 * Layout wrapper for all authenticated routes under /app.
 * Provides shared context (socket, game state) and navigation.
 */
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Toaster } from '../../components/Toaster';
import { InstructionsModal } from '../../components/InstructionsModal';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import bellImg from '../../assets/bell.png';
import heroImg from '../../assets/impostor-home.png';

export function AppLayout() {
    const { user, logout } = useAuth();
    const { connected, gameState, emit, joinError, clearJoinError } = useSocket(user);
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [showConnectingLoader, setShowConnectingLoader] = useState(false);
    const [isStuck, setIsStuck] = useState(false);
    const menuRef = useRef(null);
    const connectingLoaderTimeoutRef = useRef(null);

    // Detect when app is stuck (no connection for 10 seconds)
    useEffect(() => {
        if (user && !connected) {
            const timer = setTimeout(() => setIsStuck(true), 10000);
            return () => clearTimeout(timer);
        } else {
            setIsStuck(false);
        }
    }, [user, connected]);

    // Show connecting loader after delay
    useEffect(() => {
        if (user && !connected && !isStuck) {
            connectingLoaderTimeoutRef.current = setTimeout(() => {
                setShowConnectingLoader(true);
            }, 300);
        } else {
            if (connectingLoaderTimeoutRef.current) {
                clearTimeout(connectingLoaderTimeoutRef.current);
            }
            setShowConnectingLoader(false);
        }
        return () => {
            if (connectingLoaderTimeoutRef.current) {
                clearTimeout(connectingLoaderTimeoutRef.current);
            }
        };
    }, [user, connected, isStuck]);

    // Close menu on outside click
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

    const handleLogout = useCallback(async () => {
        setMenuOpen(false);
        if (gameState?.gameId) {
            emit('leave-game', gameState.gameId);
        }
        localStorage.clear();
        sessionStorage.clear();
        await logout();
        navigate('/');
    }, [logout, emit, gameState, navigate]);

    const forceExit = useCallback(() => {
        if (gameState?.gameId) {
            emit('leave-game', gameState.gameId);
        }
        setTimeout(() => window.location.reload(), 100);
    }, [emit, gameState]);

    const handleTitleClick = useCallback(() => {
        if (gameState?.gameId) {
            // In a game, could show leave confirmation
            navigate('/app');
        } else {
            navigate('/app');
        }
    }, [gameState, navigate]);

    // Connection lost screen
    if (isStuck) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6">
                    <div className="flex justify-center">
                        <img src={bellImg} alt="Warning" className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-400/30 shadow-lg" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif text-neutral-50 mb-2">Conexión perdida</h2>
                        <p className="text-neutral-400">No se puede conectar al servidor.</p>
                    </div>
                    <div className="space-y-3 px-6">
                        <Button onClick={() => window.location.reload()} variant="primary">Reintentar conexión</Button>
                        <Button onClick={forceExit} variant="outline">Forzar salida</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Connecting screen
    if (showConnectingLoader) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-6 text-center">
                    <img src={heroImg} alt="El Impostor" className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10" />
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

    // Not yet connected - show nothing briefly
    if (!connected) {
        return null;
    }

    return (
        <div className="bg-neutral-950 text-white min-h-[100dvh] font-sans flex flex-col">
            <Toaster />
            <InstructionsModal isOpen={instructionsOpen} onClose={() => setInstructionsOpen(false)} />

            <div className="w-full max-w-4xl mx-auto p-6 sm:p-6 lg:p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
                    <button
                        onClick={handleTitleClick}
                        className="text-xl sm:text-2xl font-serif text-neutral-50 hover:text-orange-400 transition-colors active:scale-95 cursor-pointer"
                    >
                        El Impostor
                    </button>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-sm sm:text-base font-medium hidden sm:inline">{user?.displayName}</span>
                        <div className="relative" ref={menuRef}>
                            <button
                                aria-label="Abrir menú de usuario"
                                onClick={() => setMenuOpen(v => !v)}
                                className="relative group rounded-full ring-1 ring-transparent focus:outline-none active:scale-95 transition-all duration-150"
                            >
                                <Avatar photoURL={user?.photoURL} displayName={user?.displayName} size="md" />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl z-50 animate-fadeIn">
                                    <div className="p-3 border-b border-white/10">
                                        <p className="font-medium text-sm truncate">{user?.displayName}</p>
                                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => { setMenuOpen(false); setInstructionsOpen(true); }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            📖 Instrucciones
                                        </button>

                                        {/* Game actions - only show when in a game */}
                                        {gameState?.gameId && (
                                            <>
                                                {/* End game - host only */}
                                                {gameState.hostId === user?.uid && gameState.phase !== 'lobby' && (
                                                    <button
                                                        onClick={() => {
                                                            setMenuOpen(false);
                                                            emit('end-game', gameState.gameId);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                                                    >
                                                        🏁 Terminar partida
                                                    </button>
                                                )}

                                                {/* Leave game - all users */}
                                                <button
                                                    onClick={() => {
                                                        setMenuOpen(false);

                                                        // Clear URL immediately
                                                        window.history.replaceState({}, '', '/app');

                                                        // Set flag to prevent auto-redirect on reload
                                                        sessionStorage.setItem('justLeftGame', 'true');

                                                        // Emit leave-game event
                                                        emit('leave-game', gameState.gameId, () => {
                                                            // After server acknowledges, force reload for clean state
                                                            window.location.href = '/app';
                                                        });

                                                        // Fallback: force reload if callback doesn't fire
                                                        setTimeout(() => {
                                                            window.location.href = '/app';
                                                        }, 2000);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                                                >
                                                    🚶 Abandonar partida
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            🚪 Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content - Rendered by child routes */}
                <Outlet context={{ user, connected, gameState, emit, joinError, clearJoinError }} />
            </div>
        </div>
    );
}
