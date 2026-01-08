import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useGameActions } from "../hooks/useGameActions";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { Toaster } from "../components/Toaster";
import { Spinner } from "../components/ui/Spinner";
import { InstructionsModal } from "../components/InstructionsModal";
import { FeedbackModal } from "../components/FeedbackModal";
import { ShutdownToast } from "../components/ShutdownToast";
import { MainLayout } from "../layouts/MainLayout";
import { UnauthenticatedLayout } from "../layouts/UnauthenticatedLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminProtectedRoute } from "./AdminProtectedRoute";
import { ROUTES } from "./routes";
import { HomeRoute, AuthRoute, GuestAuthRoute, GameRoute } from "./handlers";
import { LobbyPage } from "../pages/LobbyPage";
import { RulesPage } from "../pages/RulesPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { CookiesPage } from "../pages/CookiesPage";
import { AdminIndex } from "../pages/Admin";
import DebugPreviews from "../pages/DebugPreviews";
import DebugPreviewSingle from "../pages/DebugPreviewSingle";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

function AppRoutes({
    user,
    loading,
    error,
    login,
    loginWithEmail,
    registerWithEmail,
    loginAsGuest,
    logout,
    clearError,
    connected,
    gameState,
    emit,
    joinError,
    clearJoinError,
    shutdownCountdown,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const prevRoomIdRef = useRef(null);

    const { copyLink, isMobile } = useCopyToClipboard();

    // Game actions from custom hook
    const {
        createRoom,
        joinRoom,
        updateOptions,
        startMatch,
        playAgain,
        nextRound,
        leaveMatch,
        leaveRoom,
        kickPlayer,
        castVote,
    } = useGameActions(emit, gameState);

    const isHost = useMemo(
        () => gameState && user && gameState.hostId === user.uid,
        [gameState, user]
    );

    const handleCopyLink = () => copyLink(gameState?.roomId);
    const openInstructions = () => setInstructionsOpen(true);
    const closeInstructions = () => setInstructionsOpen(false);
    const openFeedback = () => setFeedbackOpen(true);
    const closeFeedback = () => setFeedbackOpen(false);

    // Navigate to game when a room is created or joined
    useEffect(() => {
        const currentRoomId = gameState?.roomId;
        const wasInLobby = location.pathname === ROUTES.LOBBY;

        // If a new room ID appears and we're in the lobby, navigate to game
        if (currentRoomId && currentRoomId !== prevRoomIdRef.current && wasInLobby) {
            console.log("Navigating to room:", currentRoomId);
            navigate(`${ROUTES.GAME}?roomId=${currentRoomId}`);
        }

        prevRoomIdRef.current = currentRoomId;
    }, [gameState?.roomId, location.pathname, navigate]);

    // Props for different route groups
    const publicRouteProps = {
        user,
        login,
        loading,
        onOpenInstructions: openInstructions,
        onOpenFeedback: openFeedback,
    };

    const authRouteProps = {
        user,
        loginWithEmail,
        registerWithEmail,
        loginAsGuest,
        loading,
        error,
        clearError,
    };

    const protectedRouteProps = {
        user,
        connected,
        emit,
        gameState,
    };

    const layoutProps = {
        user,
        gameState,
        emit,
        onLogout: logout,
        onOpenInstructions: openInstructions,
        onOpenFeedback: openFeedback,
        onCopyLink: handleCopyLink,
        isMobile,
        isHost,
    };

    const gameRouteProps = {
        gameState,
        user,
        emit,
        joinGame: joinRoom,
        joinError,
        clearJoinError,
        onOpenInstructions: openInstructions,
        onStartGame: startMatch,
        onUpdateOptions: updateOptions,
        onPlayAgain: playAgain,
        onNextRound: nextRound,
        onLeaveRoom: leaveRoom,
        onLeaveMatch: leaveMatch,
        onVote: castVote,
        onKickPlayer: kickPlayer,
    };

    return (
        <>
            <Toaster />
            <ShutdownToast shutdownCountdown={shutdownCountdown} />
            <InstructionsModal isOpen={instructionsOpen} onClose={closeInstructions} />
            <FeedbackModal isOpen={feedbackOpen} onClose={closeFeedback} user={user} />

            <Routes>
                {/* ==================== PUBLIC ROUTES ==================== */}
                <Route element={<UnauthenticatedLayout />}>
                    <Route path={ROUTES.HOME} element={<HomeRoute {...publicRouteProps} />} />
                    <Route path={ROUTES.AUTH} element={<AuthRoute {...authRouteProps} />} />
                    <Route path={ROUTES.GUEST_AUTH} element={<GuestAuthRoute {...authRouteProps} />} />
                    <Route path={ROUTES.RULES} element={<RulesPage />} />
                    <Route path="/privacidad" element={<PrivacyPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />
                    {import.meta.env.DEV && (
                        <>
                            <Route path="/debug" element={<DebugPreviews />} />
                            <Route path="/debug/preview/:viewId" element={<DebugPreviewSingle />} />
                        </>
                    )}
                </Route>

                {/* ==================== PROTECTED ROUTES ==================== */}
                <Route element={<ProtectedRoute {...protectedRouteProps} />}>
                    <Route element={<MainLayout {...layoutProps} />}>
                        <Route
                            path={ROUTES.LOBBY}
                            element={<LobbyPage user={user} onCreateGame={createRoom} />}
                        />
                        <Route path={ROUTES.GAME} element={<GameRoute {...gameRouteProps} />} />
                    </Route>
                </Route>

                {/* ==================== ADMIN ROUTES ==================== */}
                <Route
                    path={ROUTES.ADMIN}
                    element={
                        <AdminProtectedRoute>
                            <AdminIndex />
                        </AdminProtectedRoute>
                    }
                />

                {/* ==================== FALLBACK ==================== */}
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
        </>
    );
}

export function AppRouter() {
    const {
        user,
        loading,
        error,
        login,
        loginWithEmail,
        registerWithEmail,
        loginAsGuest,
        logout,
        clearError,
    } = useAuth();
    const { connected, gameState, emit, joinError, clearJoinError, shutdownCountdown } =
        useSocket(user);
    const [showLoader, setShowLoader] = useState(false);

    // Show loader only if loading takes more than 500ms (avoid flicker on quick reloads)
    useEffect(() => {
        let timeout;
        if (loading) {
            timeout = setTimeout(() => {
                setShowLoader(true);
            }, 500);
        } else {
            setShowLoader(false);
        }
        return () => clearTimeout(timeout);
    }, [loading]);

    if (loading && showLoader) {
        return (
            <div className="w-full h-100dvh flex items-center justify-center bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-6 text-center">
                    <img
                        src={heroImg}
                        alt="El Impostor"
                        className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <Spinner size="md" />
                        <div>
                            <p>Autenticando</p>
                            <p className="text-sm text-neutral-400 mt-1">Verificando sesión...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <AppRoutes
                user={user}
                loading={loading}
                error={error}
                login={login}
                loginWithEmail={loginWithEmail}
                registerWithEmail={registerWithEmail}
                loginAsGuest={loginAsGuest}
                logout={logout}
                clearError={clearError}
                connected={connected}
                gameState={gameState}
                emit={emit}
                joinError={joinError}
                clearJoinError={clearJoinError}
                shutdownCountdown={shutdownCountdown}
            />
        </BrowserRouter>
    );
}
