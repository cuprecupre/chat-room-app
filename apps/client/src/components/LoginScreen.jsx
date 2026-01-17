import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { ArrowLeft, Mail, UserCircle, Info } from "lucide-react";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

export function LoginScreen({
    onLogin,
    onGoToEmailAuth,
    onGoToGuestAuth,
    onBack,
    isLoading,
    isUpgrading = false,
    onOpenInstructions,
    onOpenFeedback,
    error,
}) {
    const { t } = useTranslation('common');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="w-full min-h-screen flex flex-col items-center bg-neutral-950 text-neutral-50 overflow-hidden">
            {/* Background elements for depth - Aligned with LandingPage */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-amber-600/12 rounded-full blur-[80px] md:blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-orange-600/12 rounded-full blur-[90px] md:blur-[120px]" />
            </div>

            {/* Back Button - Top Left */}
            <div className="w-full max-w-md px-4 mt-6 mb-2 z-10">
                <button
                    onClick={onBack}
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
                                {isUpgrading
                                    ? t('auth.registerAccount', 'Registrar cuenta')
                                    : t('login.appTitle', 'El Impostor')}
                            </h1>
                            <p className="text-neutral-400 text-lg font-light">
                                {isUpgrading
                                    ? t('auth.chooseMethod', 'Elige cómo registrar tu cuenta')
                                    : t('auth.selectionTitle', '¿Cómo quieres jugar?')}
                            </p>
                        </div>
                    </div>

                    {/* Auth Options Container */}
                    <div className="space-y-4">
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Google Auth */}
                        <Button
                            onClick={onLogin}
                            disabled={isLoading}
                            variant="primary"
                            size="lg"
                            className="w-full h-14 rounded-full text-base font-semibold group shadow-lg shadow-orange-950/20"
                        >
                            <div className="mr-3 bg-white rounded-full p-1 w-7 h-7 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
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
                            <span>
                                {isLoading ? t('auth.authenticating') : t('auth.continueWithGoogle')}
                            </span>
                        </Button>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-white/10 flex-1" />
                            <span className="text-neutral-500 text-xs uppercase tracking-widest">{t('auth.or', 'or')}</span>
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        {/* Email Auth */}
                        <Button
                            onClick={onGoToEmailAuth}
                            disabled={isLoading}
                            variant="outline"
                            size="lg"
                            className="w-full h-14 rounded-full text-base border-orange-500/30 text-orange-400 hover:bg-orange-500/5 transition-all shadow-lg shadow-orange-950/5"
                        >
                            <Mail className="mr-3 w-5 h-5" />
                            <span>{t('auth.continueWithEmail')}</span>
                        </Button>

                        {/* Guest Auth - Only show when NOT upgrading */}
                        {!isUpgrading && (
                            <div className="space-y-3 pt-2">
                                <Button
                                    onClick={onGoToGuestAuth}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-14 rounded-full text-base border-orange-500/30 text-orange-400 hover:bg-orange-500/5 transition-all"
                                >
                                    <UserCircle className="mr-3 w-5 h-5" />
                                    <span>{t('auth.continueAsGuest')}</span>
                                </Button>
                                <p className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                                    <Info className="w-3.5 h-3.5" />
                                    <span>{t('auth.guest.noProgressWarning', 'Your progress will not be saved as a guest')}</span>
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <footer className="w-full py-6 z-10">
                <p className="text-center text-xs text-neutral-600">
                    {t('footer.copyright')}
                </p>
            </footer>
        </div>
    );
}

