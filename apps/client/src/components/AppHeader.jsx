import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, LogOut, ArrowLeft, DoorOpen, Menu } from "lucide-react";

import { Avatar } from "../components/ui/Avatar";
import { LanguageSelector } from "../components/ui/LanguageSelector";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { ROUTES } from "../routes/routes";

/**
 * AppHeader - Main application header with logo, language selector, user menu
 */
export function AppHeader({
    user,
    gameState,
    emit,
    onLogout,
    onTitleClick,
    onLeaveRoomClick,
    onLeaveMatchClick,
}) {
    const { t } = useTranslation('common');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const { stats } = usePlayerStats();

    const handleLogout = useCallback(async () => {
        try {
            setMenuOpen(false);

            // Clear URL parameters before logout
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Leave room if in one
            if (gameState?.roomId) {
                emit("leave-room", gameState.roomId);
            }

            await onLogout();
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
        <header className="flex justify-between items-center">
            <button
                onClick={onTitleClick}
                className="text-xl sm:text-2xl font-serif text-neutral-50 hover:text-orange-400 transition-colors active:scale-95 cursor-pointer"
            >
                {t('login.appTitle')}
            </button>

            {/* Language Selector - Center */}
            <LanguageSelector />

            <div className="flex items-center gap-3 sm:gap-4">
                {/* Points Badge with Avatar */}
                <Link
                    to={ROUTES.PROFILE}
                    className="flex items-center gap-2 pl-3 pr-1 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium transition-colors group"
                >
                    <span className="text-base">⭐</span>
                    <span>{stats?.points || 0}</span>
                    <Avatar
                        photoURL={user.photoURL}
                        displayName={user.displayName}
                        size="sm"
                        className="ml-1 !w-7 !h-7"
                    />
                </Link>

                {/* Hamburger Menu Trigger */}
                <div className="relative" ref={menuRef}>
                    <button
                        aria-label={t('nav.openMenu', 'Open user menu')}
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                    >
                        <Menu className="w-6 h-6" />
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
                            <Link
                                to={ROUTES.PROFILE}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-neutral-200 hover:text-white hover:bg-white/10 rounded-md"
                            >
                                <User className="h-4 w-4" />
                                <span>{t('profile.myProfile', 'Mi perfil')}</span>
                            </Link>
                            <div className="my-1 h-px bg-white/10" />

                            {gameState?.roomId && (
                                <>
                                    {(gameState?.phase === "playing" || gameState?.phase === "game_over") && (
                                        <button
                                            onClick={() => {
                                                onLeaveMatchClick();
                                                setMenuOpen(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-md"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            {t('game:modals.leaveMatch.returnTitle', 'Return to room')}
                                        </button>
                                    )}
                                    {(gameState?.phase === "lobby" || gameState?.phase === "lobby_wait") && (
                                        <button
                                            onClick={() => {
                                                onLeaveRoomClick();
                                                setMenuOpen(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                                        >
                                            <DoorOpen className="h-4 w-4" />
                                            {t('game:modals.leaveRoom.title', 'Leave room')}
                                        </button>
                                    )}
                                    <div className="my-1 h-px bg-white/10" />
                                </>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-neutral-200 hover:text-white hover:bg-white/10 rounded-md"
                            >
                                <LogOut className="h-4 w-4" />
                                {t('auth.logout', 'Log out')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
