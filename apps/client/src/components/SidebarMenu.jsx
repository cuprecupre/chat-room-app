import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, LogOut, ArrowLeft, DoorOpen,
    BookOpen, MessageSquare, Coffee, Star
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { ROUTES } from '../routes/routes';
import { LanguageSelector } from './ui/LanguageSelector';

export function SidebarMenu({
    isOpen,
    onClose,
    user,
    stats,
    gameState,
    onLogout,
    onLeaveRoom,
    onLeaveMatch,
    onOpenInstructions,
    onOpenFeedback
}) {
    const { t } = useTranslation(['common', 'game']);
    const isInMatch = gameState?.phase === "playing" || gameState?.phase === "game_over";

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[300px] bg-neutral-950 border-l border-white/10 z-[60] flex flex-col shadow-2xl px-4 sm:px-0"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <span className="text-xl font-serif text-neutral-50">{t('login.appTitle')}</span>
                            <button
                                onClick={onClose}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                            {/* User Section */}
                            <div className="p-6 bg-gradient-to-b from-white/[0.02] to-transparent">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar photoURL={user?.photoURL} displayName={user?.displayName} size="lg" className="border-2 border-orange-500/20" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-neutral-50 truncate">{user?.displayName}</p>
                                        <p className="text-sm text-neutral-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                            <Star className="w-4 h-4 text-orange-400" />
                                        </div>
                                        <span className="text-sm text-neutral-400">{t('profile.points', 'Puntos acumulados')}</span>
                                    </div>
                                    <span className="font-bold text-orange-400">{stats?.points || 0}</span>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <nav className="p-4 space-y-1">
                                <p className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('nav.account', 'Mi Cuenta')}</p>

                                <Link
                                    to={ROUTES.PROFILE}
                                    onClick={onClose}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <User className="w-5 h-5 text-neutral-400" />
                                    <span>{t('profile.myProfile', 'Mi perfil')}</span>
                                </Link>

                                <div className="py-2" />
                                <p className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('nav.settings', 'Ajustes')}</p>
                                <div className="px-3 py-2">
                                    <LanguageSelector fullWidth />
                                </div>

                                {/* Conditional Game Actions */}
                                {gameState?.roomId && (
                                    <>
                                        <div className="py-2" />
                                        <p className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('nav.game', 'Partida')}</p>

                                        {isInMatch ? (
                                            <button
                                                onClick={() => { onLeaveMatch(); onClose(); }}
                                                className="flex items-center gap-3 w-full px-3 py-3 text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                                <span>{t('game:modals.leaveMatch.returnTitle', 'Return to room')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { onLeaveRoom(); onClose(); }}
                                                className="flex items-center gap-3 w-full px-3 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            >
                                                <DoorOpen className="w-5 h-5" />
                                                <span>{t('game:modals.leaveRoom.title', 'Leave room')}</span>
                                            </button>
                                        )}
                                    </>
                                )}

                                <div className="py-2" />
                                <p className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">{t('nav.resources', 'Recursos')}</p>

                                <button
                                    onClick={() => { onOpenInstructions(); onClose(); }}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <BookOpen className="w-5 h-5 text-neutral-400" />
                                    <span>{t('footer.gameRules', 'Game rules')}</span>
                                </button>

                                <a
                                    href="https://discord.gg/2N2tx7mjUE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full px-3 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                                    </svg>
                                    <span>{t('footer.discord')}</span>
                                </a>

                                <button
                                    onClick={() => { onOpenFeedback(); onClose(); }}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <MessageSquare className="w-5 h-5 text-neutral-400" />
                                    <span>{t('feedback.title', 'Help us improve')}</span>
                                </button>

                                <a
                                    href="https://buymeacoffee.com/elimpostor"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full px-3 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <Coffee className="w-5 h-5 text-neutral-400" />
                                    <span>{t('footer.support', 'Support') || 'Apoyar'}</span>
                                </a>
                            </nav>

                            {/* Footer Legal */}
                            <div className="mt-auto p-6 border-t border-white/5 space-y-4 bg-white/[0.01]">
                                <button
                                    onClick={() => { onLogout(); onClose(); }}
                                    className="flex items-center gap-3 w-full px-3 py-2 text-neutral-400 hover:text-white transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>{t('auth.logout', 'Log out')}</span>
                                </button>

                                <div className="flex gap-4 text-xs text-neutral-600 px-3">
                                    <Link to="/privacidad" onClick={onClose} className="hover:text-neutral-400 font-medium">{t('footer.privacy')}</Link>
                                    <span>·</span>
                                    <Link to="/cookies" onClick={onClose} className="hover:text-neutral-400 font-medium">{t('footer.cookies')}</Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
