import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Footer } from "../components/Footer";
import { ROUTES } from "../routes/routes";

export function MainLayout({
    user,
    gameState,
    emit,
    onLogout,
    onOpenInstructions,
    onOpenFeedback,
    onCopyLink,
    isMobile,
    isHost,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const leaveGame = useCallback(() => {
        if (gameState?.gameId) {
            // Remove gameId from URL immediately to prevent accidental reopen
            const url = new URL(window.location);
            url.searchParams.delete("gameId");
            window.history.replaceState({}, "", url.toString());

            const handleCleanExit = () => {
                // Force page reload only after server ack or timeout
                window.location.reload();
            };

            // Emit with Ack callback
            emit("leave-game", gameState.gameId, handleCleanExit);

            // Fallback: if server doesn't respond in 2s, force exit anyway
            setTimeout(handleCleanExit, 2000);
        }
    }, [emit, gameState]);

    const handleTitleClick = useCallback(() => {
        // If in a game (lobby or playing), show confirmation modal
        if (gameState?.gameId) {
            setShowLeaveGameModal(true);
        } else {
            // If not in game, go directly to lobby
            navigate(ROUTES.LOBBY);
        }
    }, [gameState, navigate]);

    const handleLogout = useCallback(async () => {
        try {
            // Close dropdown first
            setMenuOpen(false);

            // Clear URL parameters before logout
            const url = new URL(window.location);
            url.searchParams.delete("gameId");
            window.history.replaceState({}, "", url.toString());

            // Leave game if in one
            if (gameState?.gameId) {
                emit("leave-game", gameState.gameId);
            }

            // useSocket hook handles emitting leave-game on disconnect
            await onLogout();

            // Force page reload to clear all state
            window.location.reload();
        } catch (e) {
            console.error("Error during logout:", e);
        }
    }, [onLogout, emit, gameState]);

    const endGame = useCallback(() => {
        emit("end-game", gameState?.gameId);
    }, [emit, gameState]);

    // Close dropdown on outside click or Escape key
    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    return (
        <div className="bg-neutral-950 text-white min-h-[100dvh] font-sans flex flex-col">
            <div className="w-full max-w-4xl mx-auto px-6 py-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center mb-0 pb-4 sm:mb-6 sm:pb-6 border-b border-white/10">
                    <button
                        onClick={handleTitleClick}
                        className="text-xl sm:text-2xl font-serif text-neutral-50 hover:text-orange-400 transition-colors active:scale-95 cursor-pointer"
                    >
                        El Impostor
                    </button>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-sm sm:text-base font-medium hidden sm:flex items-center">
                            {user.displayName}
                        </span>
                        <div className="relative" ref={menuRef}>
                            <button
                                aria-label="Abrir menú de usuario"
                                onClick={() => setMenuOpen((v) => !v)}
                                className="relative group rounded-full ring-1 ring-transparent focus:outline-none active:scale-95 transition-all duration-150"
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    outline: "none",
                                    WebkitTapHighlightColor: "transparent",
                                    WebkitTouchCallout: "none",
                                    WebkitUserSelect: "none",
                                    userSelect: "none",
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
                                        <p className="text-sm font-semibold text-neutral-200 truncate">
                                            {user.displayName}
                                        </p>
                                        {user.email && (
                                            <p className="text-xs text-neutral-400 truncate">
                                                {user.email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="my-1 h-px bg-white/10" />
                                    {isHost && gameState?.phase === "playing" && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setShowEndGameModal(true);
                                                    setMenuOpen(false);
                                                }}
                                                className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                                            >
                                                Finalizar juego
                                            </button>
                                            <div className="my-1 h-px bg-white/10" />
                                        </>
                                    )}
                                    {gameState?.gameId && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setShowLeaveGameModal(true);
                                                    setMenuOpen(false);
                                                }}
                                                className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                                            >
                                                Abandonar partida
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
                <main>
                    <Outlet />
                </main>
            </div>

            <Footer
                onOpenInstructions={onOpenInstructions}
                onOpenFeedback={onOpenFeedback}
                gameId={gameState?.gameId}
                onCopyLink={onCopyLink}
                isMobile={isMobile}
                onLeaveGame={() => setShowLeaveGameModal(true)}
            />

            {/* Modal de confirmación para abandonar juego */}
            <Modal
                isOpen={showLeaveGameModal}
                onClose={() => setShowLeaveGameModal(false)}
                title="¿Abandonar la partida?"
                size="sm"
            >
                <div className="text-center space-y-4">
                    <p className="text-neutral-400">
                        Si abandonas, perderás tu progreso en esta partida.
                    </p>
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
                        <Button onClick={() => setShowLeaveGameModal(false)} variant="outline">
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de confirmación para finalizar juego */}
            <Modal
                isOpen={showEndGameModal}
                onClose={() => setShowEndGameModal(false)}
                title="¿Finalizar el juego?"
                size="sm"
            >
                <div className="text-center space-y-4">
                    <p className="text-neutral-400">
                        Esto terminará la partida para todos los jugadores.
                    </p>
                    <div className="space-y-2 pt-2">
                        <Button
                            onClick={() => {
                                setShowEndGameModal(false);
                                endGame();
                            }}
                            variant="danger"
                        >
                            Sí, finalizar
                        </Button>
                        <Button onClick={() => setShowEndGameModal(false)} variant="outline">
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
