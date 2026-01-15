import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { ArrowLeft, Star, Info } from "lucide-react";
import { checkProfanity } from "../utils/profanityFilter";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

export function GuestAuthScreen({ onLoginAsGuest, onLoginWithGoogle, onBack, isLoading, error, clearError }) {
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

        if (checkProfanity(trimmedName)) {
            setLocalError(t('auth.guest.errorProfanity', 'Name contains inappropriate language.'));
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
        <div className="w-full min-h-screen flex flex-col items-center">
            {/* Botón volver estilo Perfil - Top Left */}
            <div className="w-full max-w-md px-4 mt-6 mb-2">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
                    disabled={isLoading}
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t('buttons.back', 'Back')}</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 w-full z-10">
                <div className="w-full max-w-md space-y-8">
                    {/* Hero Section */}
                    <div className="text-center space-y-6">
                        <div className="relative inline-block">
                            <img
                                src={heroImg}
                                alt="El Impostor"
                                className="relative mx-auto w-32 h-32 md:w-36 md:h-36 rounded-full object-cover shadow-2xl ring-1 ring-white/10"
                            />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-serif text-white tracking-tight">
                                {t('auth.guest.title', 'Jugar como invitado')}
                            </h1>
                        </div>
                    </div>

                    {/* Guest Form */}
                    <div className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="guestName"
                                    className="block text-sm font-medium text-neutral-300 mb-2"
                                >
                                    {t('auth.guest.yourName', 'Tu nombre')}
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
                                    placeholder={t('auth.guest.placeholder', 'Tu nombre...')}
                                />
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
                                className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-orange-950/20"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Spinner size="sm" />
                                        {t('auth.guest.entering', 'Entrando...')}
                                    </span>
                                ) : (
                                    t('auth.guest.enterToPlay', 'Continuar como invitado')
                                )}
                            </Button>
                            <p className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                                <Info className="w-3.5 h-3.5" />
                                <span>{t('auth.guest.progressWarning', 'Tu progreso no se guardará como invitado')}</span>
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            <footer className="w-full py-4 px-6">
                <div className="flex items-center justify-center">
                    <p className="text-xs sm:text-sm text-neutral-500">
                        {t('footer.copyright', '© 2026 The Impostor. All rights reserved.')}
                    </p>
                </div>
            </footer>
        </div >
    );
}
