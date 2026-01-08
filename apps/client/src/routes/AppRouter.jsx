import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
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
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { LandingPage } from "../pages/LandingPage";
import { EmailAuthPage } from "../pages/EmailAuthPage";
import { GuestAuthPage } from "../pages/GuestAuthPage";
import { LobbyPage } from "../pages/LobbyPage";
import { GamePage } from "../pages/GamePage";
import { RulesPage } from "../pages/RulesPage";
import { InvitePage } from "../pages/InvitePage";
import { InviteLandingPage } from "../pages/InviteLandingPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { CookiesPage } from "../pages/CookiesPage";
import { AdminIndex } from "../pages/Admin";
import DebugPreviews from "../pages/DebugPreviews";
import DebugPreviewSingle from "../pages/DebugPreviewSingle";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

function HomeRouteHandler({ user }) {
    const location = useLocation();
    const urlRoomId = new URLSearchParams(location.search).get("roomId");

    // If user is authenticated and there's a roomId in the URL, redirect to game page with the roomId
    if (user && urlRoomId) {
        return <Navigate to={`${ROUTES.GAME}?roomId=${urlRoomId}`} replace />;
    }

    // If user is authenticated but no roomId, redirect to lobby
    if (user) {
        return <Navigate to={ROUTES.LOBBY} replace />;
    }

    // If no user, show landing page (handled by parent route)
    return null;
}

function GameRouteHandler({
    gameState,
    user,
    emit,
    joinGame,
    joinError,
    clearJoinError,
    ...props
}) {
    const location = useLocation();
    const urlRoomId = new URLSearchParams(location.search).get("roomId");

    // If there's a URL room ID but user is not in that room, show invite page
    if (urlRoomId && (!gameState?.roomId || urlRoomId !== gameState.roomId)) {
        return (
            <InvitePage
                gameState={gameState}
                emit={emit}
                joinGame={joinGame}
                joinError={joinError}
                clearJoinError={clearJoinError}
            />
        );
    }

    // If user is in a room, show game page
    if (gameState?.roomId) {
        return <GamePage gameState={gameState} user={user} emit={emit} {...props} />;
    }

    // Otherwise redirect to lobby
    return <Navigate to={ROUTES.LOBBY} replace />;
}

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

    const isHost = useMemo(
        () => gameState && user && gameState.hostId === user.uid,
        [gameState, user]
    );

    const createRoom = useCallback((options) => emit("create-room", options), [emit]);
    const joinRoom = useCallback((roomId) => emit("join-room", roomId), [emit]);
    const updateOptions = useCallback(
        (options) => emit("update-options", { roomId: gameState?.roomId, options }),
        [emit, gameState]
    );
    const startMatch = useCallback(
        (options) => emit("start-match", { roomId: gameState?.roomId, options }),
        [emit, gameState]
    );
    const playAgain = useCallback(() => emit("play-again", gameState?.roomId), [emit, gameState]);
    const nextRound = useCallback(() => emit("next-round", gameState?.roomId), [emit, gameState]);

    const leaveMatch = useCallback(() => {
        if (gameState?.roomId) {
            emit("leave-match", gameState.roomId);
        }
    }, [emit, gameState]);

    const leaveRoom = useCallback(() => {
        if (gameState?.roomId) {
            // Remove roomId from URL immediately to prevent accidental reopen
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Emit leave event - server will send game-state: null
            // GameRouteHandler will then redirect to lobby automatically
            emit("leave-room", gameState.roomId);
        }
    }, [emit, gameState]);

    const kickPlayer = useCallback((targetId) => {
        if (gameState?.roomId && targetId) {
            emit("kick-player", { roomId: gameState.roomId, targetId });
        }
    }, [emit, gameState]);

    const castVote = useCallback(
        (targetId) => {
            if (!gameState?.roomId) return;
            // Send matchId if available, fallback to roomId
            emit("cast-vote", {
                roomId: gameState.roomId,
                matchId: gameState.matchId,
                targetId,
            });
        },
        [emit, gameState]
    );

    const handleCopyLink = useCallback(() => {
        copyLink(gameState?.roomId);
    }, [copyLink, gameState?.roomId]);

    // Navigate to game when a room is created or joined
    useEffect(() => {
        const currentRoomId = gameState?.roomId;
        const wasInLobby = location.pathname === ROUTES.LOBBY;

        // If a new room ID appears and we're in the lobby, navigate to game
        if (currentRoomId && currentRoomId !== prevRoomIdRef.current && wasInLobby) {
            console.log("🎮 Navigating to room:", currentRoomId);
            navigate(`${ROUTES.GAME}?roomId=${currentRoomId}`);
        }

        prevRoomIdRef.current = currentRoomId;
    }, [gameState?.roomId, location.pathname, navigate]);

    return (
        <>
            <Toaster />
            <ShutdownToast shutdownCountdown={shutdownCountdown} />
            <InstructionsModal
                isOpen={instructionsOpen}
                onClose={() => setInstructionsOpen(false)}
            />
            <FeedbackModal
                isOpen={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
                user={user}
            />

            <Routes>
                    {/* Public routes */}
                    <Route element={<UnauthenticatedLayout />}>
                        <Route
                            path={ROUTES.HOME}
                            element={(() => {
                                const urlRoomId = new URLSearchParams(window.location.search).get(
                                    "roomId"
                                );

                                // If there's a roomId and user is NOT logged in, show InviteLandingPage
                                if (urlRoomId && !user) {
                                    return (
                                        <InviteLandingPage onLogin={login} isLoading={loading} />
                                    );
                                }

                                // If user is logged in, use HomeRouteHandler
                                if (user) {
                                    return <HomeRouteHandler user={user} />;
                                }

                                // Otherwise show LandingPage
                                return (
                                    <LandingPage
                                        onLogin={login}
                                        isLoading={loading}
                                        onOpenInstructions={() => setInstructionsOpen(true)}
                                        onOpenFeedback={() => setFeedbackOpen(true)}
                                    />
                                );
                            })()}
                        />
                        <Route
                            path={ROUTES.AUTH}
                            element={(() => {
                                const urlRoomId = new URLSearchParams(window.location.search).get(
                                    "roomId"
                                );

                                if (user) {
                                    // Si hay roomId, redirigir a game con el roomId
                                    if (urlRoomId) {
                                        return (
                                            <Navigate
                                                to={`${ROUTES.GAME}?roomId=${urlRoomId}`}
                                                replace
                                            />
                                        );
                                    }
                                    // Si no hay roomId, ir al lobby
                                    return <Navigate to={ROUTES.LOBBY} replace />;
                                }

                                return (
                                    <EmailAuthPage
                                        onLoginWithEmail={loginWithEmail}
                                        onRegisterWithEmail={registerWithEmail}
                                        isLoading={loading}
                                        error={error}
                                        clearError={clearError}
                                    />
                                );
                            })()}
                        />
                        <Route
                            path={ROUTES.GUEST_AUTH}
                            element={(() => {
                                const urlRoomId = new URLSearchParams(window.location.search).get(
                                    "roomId"
                                );

                                if (user) {
                                    // Si hay roomId, redirigir a game con el roomId
                                    if (urlRoomId) {
                                        return (
                                            <Navigate
                                                to={`${ROUTES.GAME}?roomId=${urlRoomId}`}
                                                replace
                                            />
                                        );
                                    }
                                    // Si no hay roomId, ir al lobby
                                    return <Navigate to={ROUTES.LOBBY} replace />;
                                }

                                return (
                                    <GuestAuthPage
                                        onLoginAsGuest={loginAsGuest}
                                        isLoading={loading}
                                        error={error}
                                        clearError={clearError}
                                    />
                                );
                            })()}
                        />
                        <Route path={ROUTES.RULES} element={<RulesPage />} />
                        <Route path="/privacidad" element={<PrivacyPage />} />
                        <Route path="/cookies" element={<CookiesPage />} />
                        {import.meta.env.DEV && (
                            <>
                                <Route path="/debug" element={<DebugPreviews />} />
                                <Route
                                    path="/debug/preview/:viewId"
                                    element={<DebugPreviewSingle />}
                                />
                            </>
                        )}
                    </Route>

                    {/* Protected routes */}
                    <Route
                        element={
                            <ProtectedRoute
                                user={user}
                                connected={connected}
                                emit={emit}
                                gameState={gameState}
                            />
                        }
                    >
                        <Route
                            element={
                                <MainLayout
                                    user={user}
                                    gameState={gameState}
                                    emit={emit}
                                    onLogout={logout}
                                    onOpenInstructions={() => setInstructionsOpen(true)}
                                    onOpenFeedback={() => setFeedbackOpen(true)}
                                    onCopyLink={handleCopyLink}
                                    isMobile={isMobile}
                                    isHost={isHost}
                                />
                            }
                        >
                            <Route
                                path={ROUTES.LOBBY}
                                element={<LobbyPage user={user} onCreateGame={createRoom} />}
                            />
                            <Route
                                path={ROUTES.GAME}
                                element={
                                    <GameRouteHandler
                                        gameState={gameState}
                                        user={user}
                                        emit={emit}
                                        joinGame={joinRoom}
                                        joinError={joinError}
                                        clearJoinError={clearJoinError}
                                        onOpenInstructions={() => setInstructionsOpen(true)}
                                        onStartGame={startMatch}
                                        onUpdateOptions={updateOptions}
                                        onPlayAgain={playAgain}
                                        onNextRound={nextRound}
                                        onLeaveRoom={leaveRoom}
                                        onLeaveMatch={leaveMatch}
                                        onVote={castVote}
                                        onKickPlayer={kickPlayer}
                                    />
                                }
                            />
                        </Route>
                    </Route>

                    {/* Admin routes - protected by admin check */}
                    <Route
                        path={ROUTES.ADMIN}
                        element={
                            <AdminProtectedRoute>
                                <AdminIndex />
                            </AdminProtectedRoute>
                        }
                    />

                    {/* Catch-all redirect to home */}
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
