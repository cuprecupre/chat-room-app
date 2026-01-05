import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { Toaster } from "../components/Toaster";
import { Spinner } from "../components/ui/Spinner";
import { PageLoader } from "../components/ui/PageLoader";
import { InstructionsModal } from "../components/InstructionsModal";
import { FeedbackModal } from "../components/FeedbackModal";
import { ShutdownToast } from "../components/ShutdownToast";
import { MainLayout } from "../layouts/MainLayout";
import { UnauthenticatedLayout } from "../layouts/UnauthenticatedLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "./routes";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

// Firebase Storage CDN URL
const heroImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

// Handle ChunkLoadError during deploys - auto reload when old chunks are gone
if (typeof window !== "undefined") {
    window.addEventListener("error", (e) => {
        if (
            e.message?.includes("Loading chunk") ||
            e.message?.includes("Failed to fetch dynamically imported module")
        ) {
            console.warn("Chunk load failed, reloading page...");
            window.location.reload();
        }
    });
}

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() =>
    import("../pages/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const EmailAuthPage = lazy(() =>
    import("../pages/EmailAuthPage").then((m) => ({ default: m.EmailAuthPage }))
);
const GuestAuthPage = lazy(() =>
    import("../pages/GuestAuthPage").then((m) => ({ default: m.GuestAuthPage }))
);
const LobbyPage = lazy(() => import("../pages/LobbyPage").then((m) => ({ default: m.LobbyPage })));
const GamePage = lazy(() => import("../pages/GamePage").then((m) => ({ default: m.GamePage })));
const RulesPage = lazy(() => import("../pages/RulesPage").then((m) => ({ default: m.RulesPage })));
const InvitePage = lazy(() =>
    import("../pages/InvitePage").then((m) => ({ default: m.InvitePage }))
);
const InviteLandingPage = lazy(() =>
    import("../pages/InviteLandingPage").then((m) => ({ default: m.InviteLandingPage }))
);
const PrivacyPage = lazy(() =>
    import("../pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage }))
);
const CookiesPage = lazy(() =>
    import("../pages/CookiesPage").then((m) => ({ default: m.CookiesPage }))
);

// Debug Page (Local Only - ignored in git)
const DebugPreviews = lazy(() =>
    import("../pages/DebugPreviews").catch(() => ({ default: () => null }))
);
const DebugPreviewSingle = lazy(() =>
    import("../pages/DebugPreviewSingle").catch(() => ({ default: () => null }))
);

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
    const endMatch = useCallback(() => emit("end-match", gameState?.roomId), [emit, gameState]);
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

            const handleCleanExit = () => {
                // Force page reload only after server ack or timeout
                window.location.reload();
            };

            // Emit with Ack callback
            emit("leave-room", gameState.roomId, handleCleanExit);

            // Fallback: if server doesn't respond in 2s, force exit anyway
            setTimeout(handleCleanExit, 2000);
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

    // Reset scroll when major views change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [user?.uid, gameState?.roomId]);

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

            <Suspense fallback={<PageLoader />}>
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
                                        onEndGame={endMatch}
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

                    {/* Catch-all redirect to home */}
                    <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                </Routes>
            </Suspense>
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
