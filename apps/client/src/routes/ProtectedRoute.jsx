import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { RefreshCw } from "lucide-react";
import { showToast } from "../lib/toast";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

import { ROUTES } from "./routes";

export function ProtectedRoute({ user, connected, emit, gameState, needsProfileSetup }) {
    const { t, i18n } = useTranslation('common');

    // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
    const [isStuck, setIsStuck] = useState(false);
    const [showConnectingLoader, setShowConnectingLoader] = useState(false);
    const connectingLoaderTimeoutRef = useRef(null);

    // Detect when app is stuck (no connection for 10 seconds)
    useEffect(() => {
        if (user && !connected) {
            const timer = setTimeout(() => {
                setIsStuck(true);
            }, 10000); // 10 seconds

            return () => clearTimeout(timer);
        } else {
            setIsStuck(false);
        }
    }, [user, connected]);

    // Show connecting loader only if connection takes more than 300ms
    useEffect(() => {
        if (user && !connected && !isStuck) {
            connectingLoaderTimeoutRef.current = setTimeout(() => {
                setShowConnectingLoader(true);
            }, 300);
        } else {
            if (connectingLoaderTimeoutRef.current) {
                clearTimeout(connectingLoaderTimeoutRef.current);
            }
            setShowConnectingLoader(false);
        }

        return () => {
            if (connectingLoaderTimeoutRef.current) {
                clearTimeout(connectingLoaderTimeoutRef.current);
            }
        };
    }, [user, connected, isStuck]);

    // Si el usuario necesita configurar su perfil, redirigir a /setup-profile
    // NOTE: This conditional return must come AFTER all hooks
    if (user && needsProfileSetup && window.location.pathname !== ROUTES.SETUP_PROFILE) {
        return <Navigate to={ROUTES.SETUP_PROFILE} replace />;
    }

    const handleForceExit = () => {
        // Clear URL parameters immediately
        const url = new URL(window.location);
        url.searchParams.delete("roomId");
        window.history.replaceState({}, "", url.toString());

        // Show toast immediately
        showToast(t('errors.sessionReset', "Sesión reiniciada. Vuelve al lobby."));

        const handleCleanExit = () => {
            window.location.reload();
        };

        // Force disconnect and clear state with Ack
        if (gameState?.roomId) {
            emit("leave-room", gameState.roomId, handleCleanExit);
            // Fallback timeout
            setTimeout(handleCleanExit, 2000);
        } else {
            // If no room ID known, just reload with small delay
            setTimeout(handleCleanExit, 100);
        }
    };

    // Redirect to home if no user (preserve roomId for invitation flow)
    if (!user) {
        const urlRoomId = new URLSearchParams(window.location.search).get("roomId");
        // Determine correct home route based on current language
        const isEnglish = i18n.language.startsWith('en');
        const baseHome = isEnglish ? "/en" : "/";

        const redirectTo = urlRoomId ? `${baseHome}?roomId=${urlRoomId}` : baseHome;
        return <Navigate to={redirectTo} replace />;
    }

    // Show stuck connection screen
    if (user && !connected && isStuck) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center shadow-lg">
                            <RefreshCw className="w-10 h-10 text-orange-400 animate-spin-slow" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif text-neutral-50 mb-2">
                            {t('errors.connectionLost', 'Conexión perdida')}
                        </h2>
                        <p className="text-neutral-400">
                            {t('errors.cantConnect', 'No se puede conectar al servidor. Esto puede deberse a problemas de red o el servidor está inactivo.')}
                        </p>
                    </div>
                    <div className="space-y-3 px-6">
                        <Button onClick={() => window.location.reload()} variant="primary">
                            {t('errors.retryConnection', 'Reintentar conexión')}
                        </Button>
                        <Button onClick={handleForceExit} variant="outline">
                            {t('buttons.forceExit', 'Forzar salida')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Show connecting loader if connection takes more than 300ms
    if (user && !connected && showConnectingLoader) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-6 text-center">
                    <img
                        src={heroImg}
                        alt="El Impostor"
                        className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <Spinner size="md" />
                        <div>
                            <p>{t('system.authenticating', 'Conectando al servidor')}</p>
                            <p className="text-sm text-neutral-400 mt-1">
                                {t('system.verifyingSession', 'Estableciendo conexión...')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If still connecting but less than 300ms, don't show anything (avoid flicker)
    if (user && !connected) {
        return null;
    }

    // User is authenticated and connected, render child routes
    return <Outlet />;
}
