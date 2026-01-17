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
    onTitleClick,
    onOpenMenu,
}) {
    const { t } = useTranslation('common');
    const { stats } = usePlayerStats();

    return (
        <header className="flex justify-between items-center">
            <button
                onClick={onTitleClick}
                className="text-xl sm:text-2xl font-serif text-neutral-50 hover:text-orange-400 transition-colors active:scale-95 cursor-pointer"
            >
                {t('login.appTitle')}
            </button>

            {/* Language Selector could be here or hidden on mobile */}
            <div className="hidden sm:block">
                <LanguageSelector />
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                {/* Points Badge with Avatar */}
                <Link
                    to={ROUTES.PROFILE}
                    className="flex items-center gap-2 pl-3 pr-1 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium transition-colors group"
                >
                    <span className="text-base leading-none">⭐</span>
                    <span className="leading-none">{stats?.points || 0}</span>
                    <Avatar
                        photoURL={user?.photoURL}
                        displayName={user?.displayName}
                        size="sm"
                        className="ml-1 !w-7 !h-7"
                    />
                </Link>

                {/* Sidebar Trigger */}
                <button
                    aria-label={t('nav.openMenu', 'Open menu')}
                    onClick={onOpenMenu}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}
