import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

export function GuestAuthScreen({ onLoginAsGuest, onBack, isLoading, error, clearError }) {
    const { t } = useTranslation('common');
    const [displayName, setDisplayName] = useState("");
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError("");

        const trimmedName = displayName.trim();
        if (trimmedName.length < 2) {
            setLocalError(t('auth.guest.errorMinLength', 'Name must be at least 2 characters.'));
            return;
        }
        if (trimmedName.length > 30) {
            setLocalError(t('auth.guest.errorMaxLength', 'Name cannot be more than 30 characters.'));
            return;
        }

        onLoginAsGuest(trimmedName);
    };

    const handleBack = () => {
        setDisplayName("");
        setLocalError("");
        if (clearError) clearError();
        onBack();
    };

    const displayError = localError || error;

    return (
        <div className="w-full min-h-screen flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    {/* Logo/Header */}
                    <div className="text-center space-y-4">
                        <div className="perspective-1000 animate-scaleIn">
                            <img
                                src={heroImg}
                                alt="The Impostor"
                                className="mx-auto w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10"
                                loading="lazy"
                            />
                        </div>
                        <h1 className="text-3xl font-serif text-neutral-50">{t('auth.guest.title', 'Play as guest')}</h1>
                        <p className="text-neutral-400">
                            {t('auth.guest.subtitle', 'Enter a name so other players can recognize you')}
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
                        <div>
                            <label
                                htmlFor="guestName"
                                className="block text-sm font-medium text-neutral-300 mb-2"
                            >
                                {t('auth.guest.yourName', 'Your name')}
                            </label>
                            <input
                                id="guestName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                disabled={isLoading}
                                autoFocus
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                placeholder={t('auth.guest.placeholder', 'Ex: John')}
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                {t('auth.guest.visibleNote', 'This name will be visible to all players')}
                            </p>
                        </div>

                        {displayError && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                {displayError}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Spinner size="sm" />
                                    {t('auth.guest.entering', 'Entering...')}
                                </span>
                            ) : (
                                t('auth.guest.enterToPlay', 'Enter to play')
                            )}
                        </Button>
                    </form>

                    {/* Botón de volver */}
                    <Button
                        onClick={handleBack}
                        disabled={isLoading}
                        variant="ghost"
                        size="md"
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        <span>{t('buttons.back', 'Back')}</span>
                    </Button>

                    {/* Nota informativa */}
                    <div className="text-center text-xs text-neutral-500 space-y-1">
                        <p>{t('auth.guest.note1', 'As a guest you can play without registering.')}</p>
                        <p>{t('auth.guest.note2', 'Your session will be kept until you close the browser.')}</p>
                    </div>
                </div>
            </div>

            <footer className="w-full py-4 px-6">
                <div className="flex items-center justify-center">
                    <p className="text-xs sm:text-sm text-neutral-500">
                        {t('footer.copyright', '© 2025 The Impostor. All rights reserved.')}
                    </p>
                </div>
            </footer>
        </div>
    );
}
