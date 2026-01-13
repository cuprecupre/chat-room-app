import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { Avatar } from "./ui/Avatar";
import { Camera, RefreshCw, X, ArrowLeft, Mail, UserCircle, Info } from "lucide-react";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

const STORAGE_KEY = "emailAuth:state";

// Función helper fuera del componente para evitar recreación en cada render
const getInitialState = () => {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (err) { }
    return { mode: "select", email: "", displayName: "" };
};

export function EmailAuthScreen({
    onLoginWithEmail,
    onRegisterWithEmail,
    onRecoverPassword,
    onBack,
    isLoading,
    error,
    clearError,
}) {
    const { t } = useTranslation('common');
    // Usar función inicializadora para ejecutar solo una vez
    const [initialState] = useState(getInitialState);
    const [mode, setMode] = useState(initialState.mode); // "select" | "login" | "register" | "recover"
    const [email, setEmail] = useState(initialState.email);
    const [password, setPassword] = useState(""); // Nunca persistir contraseña
    const [displayName, setDisplayName] = useState(initialState.displayName);
    const [photoURL, setPhotoURL] = useState(`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${Math.random().toString(36).substring(7)}`);
    const [localError, setLocalError] = useState("");
    const [recoverySent, setRecoverySent] = useState(false);
    const wasLoadingRef = useRef(false);
    const lastModeRef = useRef(initialState.mode);
    const lastSavedStateRef = useRef("");

    // Mantener el modo activo cuando hay un error después de intentar login/registro
    useEffect(() => {
        // Si estábamos cargando y ahora hay un error, mantener el último modo activo
        wasLoadingRef.current = isLoading;
    }, [isLoading, error]);

    // Scroll reset when mode changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [mode]);

    // Rastrear el modo actual
    useEffect(() => {
        if (mode !== "select") {
            lastModeRef.current = mode;
        }
    }, [mode]);

    // Persistir estado en sessionStorage cada vez que cambia

    useEffect(() => {
        const state = { mode, email, displayName };
        const stateString = JSON.stringify(state);

        // Solo guardar si realmente cambió
        if (stateString !== lastSavedStateRef.current) {
            sessionStorage.setItem(STORAGE_KEY, stateString);
            lastSavedStateRef.current = stateString;
        }
    }, [mode, email, displayName]);

    const handleBack = () => {
        setEmail("");
        setPassword("");
        setDisplayName("");
        setLocalError("");
        setRecoverySent(false);
        if (clearError) clearError();
        if (mode === "select") {
            // Limpiar estado persistido al volver a LoginScreen
            sessionStorage.removeItem(STORAGE_KEY);
            lastSavedStateRef.current = "";
            onBack();
        } else {
            setMode("select");
            lastModeRef.current = "select";
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setLocalError("");
        lastModeRef.current = "login";
        onLoginWithEmail(email, password);
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setLocalError("");

        if (!displayName.trim()) {
            setLocalError(t('auth.enterNameError', 'Introduce tu nombre de usuario.'));
            return;
        }
        lastModeRef.current = "register";
        onRegisterWithEmail(email, password, displayName, photoURL);
    };

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


    const handleRecover = async (e) => {
        e.preventDefault();
        setLocalError("");
        if (!email) {
            setLocalError(t('auth.enterEmailError', 'Introduce tu email.'));
            return;
        }
        const success = await onRecoverPassword(email);
        if (success) {
            setRecoverySent(true);
        }
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
                                alt="El Impostor"
                                className="mx-auto w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10"
                                loading="lazy"
                            />
                        </div>
                        <h1 className="text-3xl font-serif text-neutral-50">
                            {mode === "select" && (t('auth.accessWithEmail', 'Acceder con Email'))}
                            {mode === "login" && t('auth.login')}
                            {mode === "register" && t('auth.createAccount')}
                            {mode === "recover" && (t('auth.recoverPassword', 'Recuperar Contraseña'))}
                        </h1>
                    </div>

                    {/* Pantalla de selección */}
                    {mode === "select" && (
                        <div className="space-y-4 animate-fadeIn">
                            <p className="text-neutral-300 text-center">
                                {t('auth.accountQuestion')}
                            </p>

                            <Button
                                onClick={() => {
                                    setMode("login");
                                    setLocalError("");
                                    if (clearError) clearError();
                                }}
                                variant="primary"
                                size="lg"
                                className="w-full"
                            >
                                {t('auth.login')}
                            </Button>

                            <Button
                                onClick={() => {
                                    setMode("register");
                                    setLocalError("");
                                    if (clearError) clearError();
                                }}
                                variant="outline"
                                size="lg"
                                className="w-full"
                            >
                                {t('auth.createNewAccount')}
                            </Button>
                        </div>
                    )}

                    {/* Formulario de Login */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-neutral-300 mb-2"
                                >
                                    {t('auth.email')}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                    placeholder={t('auth.emailPlaceholder')}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-neutral-300 mb-2"
                                >
                                    {t('auth.password')}
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                    placeholder={t('auth.passwordPlaceholder')}
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
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Spinner size="sm" />
                                        {t('auth.loggingIn')}
                                    </span>
                                ) : (
                                    t('auth.login')
                                )}
                            </Button>

                            <div className="text-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("recover");
                                        if (clearError) clearError();
                                    }}
                                    className="text-sm text-neutral-400 hover:text-orange-400 transition-colors"
                                >
                                    {t('auth.forgotPassword', '¿Has olvidado tu contraseña?')}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Formulario de Registro */}
                    {mode === "register" && (
                        <form onSubmit={handleRegister} className="space-y-6 animate-fadeIn">
                            {/* Avatar Selector en Registro */}
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-sm font-medium text-neutral-300">
                                    {t('auth.chooseAvatar', 'Elige tu avatar')}
                                </p>
                                <div className="relative group">
                                    <Avatar
                                        photoURL={photoURL}
                                        displayName={displayName || "U"}
                                        size="xl"
                                        className="shadow-xl bg-neutral-800"
                                    />
                                    <div className="absolute -bottom-2 -right-2 flex gap-1 z-20">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRandomAvatar();
                                            }}
                                            className="bg-neutral-800 p-2 rounded-full text-white shadow-lg border border-white/10 hover:bg-neutral-700 transition-colors pointer-events-auto"
                                            title={t('auth.randomAvatar')}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="displayName"
                                    className="block text-sm font-medium text-neutral-300 mb-2"
                                >
                                    {t('auth.username', 'Nombre de usuario')}
                                </label>
                                <input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                    placeholder={t('auth.namePlaceholder')}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email-register"
                                    className="block text-sm font-medium text-neutral-300 mb-2"
                                >
                                    {t('auth.email')}
                                </label>
                                <input
                                    id="email-register"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                    placeholder={t('auth.emailPlaceholder')}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password-register"
                                    className="block text-sm font-medium text-neutral-300 mb-2"
                                >
                                    {t('auth.password')}
                                </label>
                                <input
                                    id="password-register"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                    placeholder={t('auth.passwordPlaceholder')}
                                />
                                <p className="text-xs text-neutral-400 mt-1">{t('auth.minPassword')}</p>
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
                                        {t('auth.creatingAccount')}
                                    </span>
                                ) : (
                                    t('auth.createAccount')
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Formulario de Recuperación */}
                    {mode === "recover" && (
                        <div className="space-y-4 animate-fadeIn">
                            {!recoverySent ? (
                                <form onSubmit={handleRecover} className="space-y-4">
                                    <p className="text-neutral-400 text-sm text-center">
                                        {t('auth.recoverInstructions', 'Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.')}
                                    </p>
                                    <div>
                                        <label
                                            htmlFor="email-recover"
                                            className="block text-sm font-medium text-neutral-300 mb-2"
                                        >
                                            {t('auth.email')}
                                        </label>
                                        <input
                                            id="email-recover"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                                            placeholder={t('auth.emailPlaceholder')}
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
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Spinner size="sm" />
                                                {t('buttons.sending', 'Enviando...')}
                                            </span>
                                        ) : (
                                            t('buttons.send', 'Enviar enlace')
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center space-y-4 py-4">
                                    <div className="flex justify-center">
                                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h1 className="text-xl font-serif font-normal text-white">
                                        {t('auth.emailSent', '¡Email enviado!')}
                                    </h1>
                                    <p className="text-neutral-400 text-sm px-4">
                                        {t('auth.checkInbox', 'Si el email está registrado, recibirás un enlace en unos segundos. Revisa también tu carpeta de spam.')}
                                    </p>
                                    <Button
                                        onClick={() => setMode("login")}
                                        variant="outline"
                                        size="md"
                                        className="w-full"
                                    >
                                        {t('auth.backToLogin', 'Volver al login')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

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
                        <span>{t('buttons.back')}</span>
                    </Button>
                </div>
            </div>

            <footer className="w-full py-4 px-6">
                <div className="flex items-center justify-center">
                    <p className="text-xs sm:text-sm text-neutral-500">
                        {t('footer.copyright')}
                    </p>
                </div>
            </footer>
        </div >
    );
}
