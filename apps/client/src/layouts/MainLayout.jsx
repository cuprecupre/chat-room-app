import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "../components/ui/Avatar";
import { Footer } from "../components/Footer";
import { LeaveMatchModal } from "../components/LeaveMatchModal";
import { LeaveRoomModal } from "../components/LeaveRoomModal";
import { LanguageSelector } from "../components/ui/LanguageSelector";
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
    const { t } = useTranslation('common');
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLeaveRoomModal, setShowLeaveRoomModal] = useState(false);
    const [showLeaveMatchModal, setShowLeaveMatchModal] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const leaveRoom = useCallback(() => {
        if (gameState?.roomId) {
            // Remove roomId from URL immediately to prevent accidental reopen
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Emit leave-room and navigate to lobby
            emit("leave-room", gameState.roomId);
            navigate(ROUTES.LOBBY);
        }
    }, [emit, gameState, navigate]);

    const leaveMatch = useCallback(() => {
        if (gameState?.roomId) {
            emit("leave-match", gameState.roomId);
            setShowLeaveMatchModal(false);
            setMenuOpen(false);
        }
    }, [emit, gameState]);

    const handleLeaveMatchClick = useCallback(() => {
        setShowLeaveMatchModal(true);
        setMenuOpen(false);
    }, []);

    const handleTitleClick = useCallback(() => {
        // If in a room (lobby or playing), show confirmation modal
        if (gameState?.roomId) {
            setShowLeaveRoomModal(true);
        } else {
            // If not in room, go directly to lobby
            navigate(ROUTES.LOBBY);
        }
    }, [gameState, navigate]);

    const handleLogout = useCallback(async () => {
        try {
            // Close dropdown first
            setMenuOpen(false);

            // Clear URL parameters before logout
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Leave room if in one
            if (gameState?.roomId) {
                emit("leave-room", gameState.roomId);
            }

            // useSocket hook handles emitting leave-game on disconnect
            await onLogout();

            // Navigate to home page
            navigate(ROUTES.HOME);
        } catch (e) {
            console.error("Error during logout:", e);
        }
    }, [onLogout, emit, gameState, navigate]);

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
                        {/* Language Selector */}
                        <LanguageSelector />

                        <span className="text-sm sm:text-base font-medium hidden sm:flex items-center">
                            {user.displayName}
                        </span>
                        <div className="relative" ref={menuRef}>
                            <button
                                aria-label={t('nav.openMenu', 'Open user menu')}
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

                                    {gameState?.roomId && (
                                        <>
                                            {(gameState?.phase === "playing" || gameState?.phase === "game_over") && (
                                                <button
                                                    onClick={handleLeaveMatchClick}
                                                    className="block w-full text-left px-3 py-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-md"
                                                >
                                                    {t('game:modals.leaveMatch.returnTitle', 'Return to room')}
                                                </button>
                                            )}
                                            {(gameState?.phase === "lobby" || gameState?.phase === "lobby_wait") && (
                                                <button
                                                    onClick={() => {
                                                        setShowLeaveRoomModal(true);
                                                        setMenuOpen(false);
                                                    }}
                                                    className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                                                >
                                                    {t('game:modals.leaveRoom.title', 'Leave room')}
                                                </button>
                                            )}
                                            <div className="my-1 h-px bg-white/10" />
                                        </>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-3 py-2 text-neutral-200 hover:text-white hover:bg-white/10 rounded-md"
                                    >
                                        {t('auth.logout', 'Log out')}
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
                roomId={gameState?.roomId}
                onCopyLink={onCopyLink}
                isMobile={isMobile}
                phase={gameState?.phase}
                onLeaveMatch={handleLeaveMatchClick}
                onLeaveRoom={() => setShowLeaveRoomModal(true)}
            />

            {/* Modal de confirmación para abandonar sala */}
            <LeaveRoomModal
                isOpen={showLeaveRoomModal}
                onClose={() => setShowLeaveRoomModal(false)}
                onConfirm={() => {
                    setShowLeaveRoomModal(false);
                    leaveRoom();
                }}
            />

            {/* Modal de confirmación para abandonar partida */}
            <LeaveMatchModal
                isOpen={showLeaveMatchModal}
                onClose={() => setShowLeaveMatchModal(false)}
                onConfirm={leaveMatch}
                isGameOver={gameState?.phase === "game_over"}
                isHost={isHost}
            />

        </div>
    );
}
