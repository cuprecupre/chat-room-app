import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { ArrowLeft, Star, Info } from "lucide-react";

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

            <div className="flex-1 flex items-center justify-center p-4 w-full">
                <div className="w-full max-w-md space-y-6">
                    {/* Logo/Header */}
                    <div className="text-center space-y-4">




                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-center">
                            <div className="flex flex-col items-center gap-3 mb-6">
                                <img
                                    src={heroImg}
                                    alt="The Impostor"
                                    className="w-20 h-20 rounded-full object-cover shadow-lg mb-2 ring-2 ring-orange-500/20"
                                />
                                <p className="text-orange-200 text-lg leading-relaxed max-w-[95%]">
                                    {t('auth.guest.googleRecommendation', 'If you want to save your progress and stats, we recommend signing in with a Google account.')}
                                </p>
                            </div>
                            <Button
                                onClick={onLoginWithGoogle}
                                disabled={isLoading}
                                variant="primary"
                                size="lg"
                                className="w-full shadow-none text-base rounded-full group px-8 h-14"
                            >
                                <div className="mr-3 bg-white rounded-full p-1 w-7 h-7 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-neutral-900">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <g clipPath="url(#clip0_643_9687)">
                                            <path
                                                d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z"
                                                fill="#EA4335"
                                            />
                                            <path
                                                d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z"
                                                fill="#34A853"
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_643_9687">
                                                <rect width="16" height="16" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                                <span className="align-middle font-semibold">
                                    {t('auth.continueWithGoogle')}
                                </span>
                            </Button>
                        </div>
                    </div>
                    <div className="w-full h-px bg-white/10 my-6" />
                    <h1 className="text-3xl font-serif text-neutral-50 leading-tight mt-2 text-center">{t('auth.guest.title', 'Play as guest')}</h1>



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

                        </div>

                        {displayError && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                {displayError}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="outline"
                            size="lg"
                            className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20"
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
                        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-3">
                            <Info className="w-3 h-3" />
                            <span>{t('auth.guest.progressWarning', 'As a guest your progress will not be saved.')}</span>
                        </p>
                    </form>




                </div>
            </div>

            <footer className="w-full py-4 px-6">
                <div className="flex items-center justify-center">
                    <p className="text-xs sm:text-sm text-neutral-500">
                        {t('footer.copyright', '© 2025 The Impostor. All rights reserved.')}
                    </p>
                </div>
            </footer>
        </div >
    );
}
