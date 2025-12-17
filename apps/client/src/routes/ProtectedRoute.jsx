import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import heroImg from "../assets/impostor-home.png";
import bellImg from "../assets/bell.png";
import { ROUTES } from "./routes";
import { showToast } from "../lib/toast";

export function ProtectedRoute({ user, connected, emit, gameState }) {
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

    const handleForceExit = () => {
        // Clear URL parameters immediately
        const url = new URL(window.location);
        url.searchParams.delete("gameId");
        window.history.replaceState({}, "", url.toString());

        // Show toast immediately
        showToast("Sesión reiniciada. Vuelve al lobby.");

        const handleCleanExit = () => {
            window.location.reload();
        };

        // Force disconnect and clear state with Ack
        if (gameState?.gameId) {
            emit("leave-game", gameState.gameId, handleCleanExit);
            // Fallback timeout
            setTimeout(handleCleanExit, 2000);
        } else {
            // If no game ID known, just reload with small delay
            setTimeout(handleCleanExit, 100);
        }
    };

    // Redirect to home if no user
    if (!user) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    // Show stuck connection screen
    if (user && !connected && isStuck) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6">
                    <div className="flex justify-center">
                        <img
                            src={bellImg}
                            alt="Advertencia"
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-orange-400/30 shadow-lg"
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif text-neutral-50 mb-2">Conexión perdida</h2>
                        <p className="text-neutral-400">
                            No se puede conectar al servidor. Esto puede deberse a problemas de red o
                            el servidor está inactivo.
                        </p>
                    </div>
                    <div className="space-y-3 px-6">
                        <Button onClick={() => window.location.reload()} variant="primary">
                            Reintentar conexión
                        </Button>
                        <Button onClick={handleForceExit} variant="outline">
                            Forzar salida
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
                            <p>Conectando al servidor</p>
                            <p className="text-sm text-neutral-400 mt-1">Estableciendo conexión...</p>
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

