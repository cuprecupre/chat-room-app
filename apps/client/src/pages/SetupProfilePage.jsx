import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Camera, RefreshCw, Check, UserCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { checkProfanity } from "../utils/profanityFilter";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../routes/routes";

export function SetupProfilePage({ gameState }) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { user, updateUserInfo, setNeedsProfileSetup } = useAuth();
    const isInMatch = gameState?.phase === "playing" || gameState?.phase === "round_result";

    const [name, setName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.displayName || "");
            setPhotoURL(user.photoURL || "");
        }
    }, [user]);

    const handleRandomAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        setPhotoURL(`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`);
    };

    useEffect(() => {
        return () => {
            if (photoURL && photoURL.startsWith('blob:')) {
                URL.revokeObjectURL(photoURL);
            }
        };
    }, [photoURL]);


    const handleContinue = async () => {
        if (!name.trim()) {
            setError(t('auth.enterNameError', 'Introduce un nombre de usuario.'));
            return;
        }

        if (checkProfanity(name)) {
            setError(t('auth.guest.errorProfanity', 'El nombre contiene lenguaje inapropiado.'));
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            const success = await updateUserInfo(name, photoURL);
            if (success) {
                setNeedsProfileSetup(false);
                navigate(ROUTES.LOBBY);
            } else {
                setError(t('errors.generic', 'Algo ha salido mal. Inténtalo de nuevo.'));
            }
        } catch (err) {
            setError(t('errors.generic', 'Algo ha salido mal. Inténtalo de nuevo.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
            <div className="w-full max-w-md space-y-8 animate-fadeIn">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-serif text-white">
                        {t('auth.setupProfileTitle', 'Personaliza tu perfil')}
                    </h1>
                    <p className="text-neutral-400 font-light">
                        {t('auth.setupProfileDesc', 'Antes de empezar, elige cómo quieres que te vean los demás.')}
                    </p>
                </div>

                <div className="bg-neutral-900/50 rounded-2xl p-8 shadow-xl space-y-8">
                    {/* Avatar Picker */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar
                                photoURL={photoURL}
                                displayName={name || "?"}
                                size="xl"
                                className="shadow-2xl bg-neutral-800"
                            />
                            <div className="absolute -bottom-2 right-0 flex gap-1 z-20">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRandomAvatar();
                                    }}
                                    className="bg-neutral-800 p-2.5 rounded-full text-white shadow-lg border border-white/10 hover:bg-neutral-700 transition-all active:scale-90 pointer-events-auto"
                                    title={t('auth.randomAvatar')}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold ml-1">
                            {t('auth.username', 'Nombre de usuario')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all font-light"
                            placeholder={t('auth.namePlaceholder', 'Tu nombre...')}
                            maxLength={20}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm animate-shake">
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleContinue}
                        disabled={isSaving || !name.trim() || isInMatch}
                        variant="primary"
                        size="lg"
                        className="w-full h-14 rounded-full shadow-lg shadow-orange-900/20"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>{t('buttons.saving', 'Guardando...')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5" />
                                <span>{t('buttons.continue', 'Continuar al juego')}</span>
                            </div>
                        )}
                    </Button>

                    {isInMatch && (
                        <p className="text-xs text-orange-500/80 font-medium text-center animate-pulse">
                            ⚠️ {t('profile.cannotEditWarning', 'No puedes cambiar tu nombre mientras juegas')}
                        </p>
                    )}
                </div>

                <p className="text-center text-xs text-neutral-500">
                    {t('auth.setupLaterInfo', 'Podrás cambiar esto más tarde desde tu perfil.')}
                </p>
            </div>
        </div>
    );
}
