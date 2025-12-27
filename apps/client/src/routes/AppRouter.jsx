import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { Toaster } from "../components/Toaster";
import { Spinner } from "../components/ui/Spinner";
import { PageLoader } from "../components/ui/PageLoader";
import { InstructionsModal } from "../components/InstructionsModal";
import { FeedbackModal } from "../components/FeedbackModal";
import { MainLayout } from "../layouts/MainLayout";
import { UnauthenticatedLayout } from "../layouts/UnauthenticatedLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "./routes";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import heroImg from "../assets/impostor-home.jpg";

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

// Debug Page (Local Only - ignored in git)
const DebugPreviews = lazy(() =>
    import("../pages/DebugPreviews").catch(() => ({ default: () => null }))
);
const DebugPreviewSingle = lazy(() =>
    import("../pages/DebugPreviewSingle").catch(() => ({ default: () => null }))
);

function HomeRouteHandler({ user }) {
    const location = useLocation();
    const urlGameId = new URLSearchParams(location.search).get("gameId");

    // If user is authenticated and there's a gameId in the URL, redirect to game page with the gameId
    if (user && urlGameId) {
        return <Navigate to={`${ROUTES.GAME}?gameId=${urlGameId}`} replace />;
    }

    // If user is authenticated but no gameId, redirect to lobby
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
    const urlGameId = new URLSearchParams(location.search).get("gameId");

    // If there's a URL game ID but user is not in that game, show invite page
    if (urlGameId && (!gameState?.gameId || urlGameId !== gameState.gameId)) {
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

    // If user is in a game, show game room
    if (gameState?.gameId) {
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
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const prevGameIdRef = useRef(null);

    const { copyLink, isMobile } = useCopyToClipboard();

    const isHost = useMemo(
        () => gameState && user && gameState.hostId === user.uid,
        [gameState, user]
    );

    const createGame = useCallback((options) => emit("create-game", options), [emit]);
    const joinGame = useCallback((gameId) => emit("join-game", gameId), [emit]);
    const startGame = useCallback(() => emit("start-game", gameState?.gameId), [emit, gameState]);
    const endGame = useCallback(() => emit("end-game", gameState?.gameId), [emit, gameState]);
    const playAgain = useCallback(() => emit("play-again", gameState?.gameId), [emit, gameState]);
    const migrateGame = useCallback(
        () => emit("migrate-game", gameState?.gameId),
        [emit, gameState]
    );
    const nextRound = useCallback(() => emit("next-round", gameState?.gameId), [emit, gameState]);
    const leaveGame = useCallback(() => {
        if (gameState?.gameId) {
            // Remove gameId from URL immediately to prevent accidental reopen
            const url = new URL(window.location);
            url.searchParams.delete("gameId");
            window.history.replaceState({}, "", url.toString());

            const handleCleanExit = () => {
                // Force page reload only after server ack or timeout
                window.location.reload();
            };

            // Emit with Ack callback
            emit("leave-game", gameState.gameId, handleCleanExit);

            // Fallback: if server doesn't respond in 2s, force exit anyway
            setTimeout(handleCleanExit, 2000);
        }
    }, [emit, gameState]);

    const castVote = useCallback(
        (targetId) => {
            if (!gameState?.gameId) return;
            emit("cast-vote", { gameId: gameState.gameId, targetId });
        },
        [emit, gameState]
    );

    const handleCopyLink = useCallback(() => {
        copyLink(gameState?.gameId);
    }, [copyLink, gameState?.gameId]);

    // Navigate to game when a game is created or joined
    useEffect(() => {
        const currentGameId = gameState?.gameId;
        const wasInLobby = location.pathname === ROUTES.LOBBY;

        // If a new game ID appears and we're in the lobby, navigate to game
        if (currentGameId && currentGameId !== prevGameIdRef.current && wasInLobby) {
            console.log("🎮 Navigating to game:", currentGameId);
            navigate(`${ROUTES.GAME}?gameId=${currentGameId}`);
        }

        prevGameIdRef.current = currentGameId;
    }, [gameState?.gameId, location.pathname, navigate]);

    // Reset scroll when major views change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [user?.uid, gameState?.gameId]);

    return (
        <>
            <Toaster />
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
                                const urlGameId = new URLSearchParams(window.location.search).get(
                                    "gameId"
                                );

                                // If there's a gameId and user is NOT logged in, show InviteLandingPage
                                if (urlGameId && !user) {
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
                                const urlGameId = new URLSearchParams(window.location.search).get(
                                    "gameId"
                                );

                                if (user) {
                                    // Si hay gameId, redirigir a game con el gameId
                                    if (urlGameId) {
                                        return (
                                            <Navigate
                                                to={`${ROUTES.GAME}?gameId=${urlGameId}`}
                                                replace
                                            />
                                        );
                                    }
                                    // Si no hay gameId, ir al lobby
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
                                const urlGameId = new URLSearchParams(window.location.search).get(
                                    "gameId"
                                );

                                if (user) {
                                    // Si hay gameId, redirigir a game con el gameId
                                    if (urlGameId) {
                                        return (
                                            <Navigate
                                                to={`${ROUTES.GAME}?gameId=${urlGameId}`}
                                                replace
                                            />
                                        );
                                    }
                                    // Si no hay gameId, ir al lobby
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
                        {import.meta.env.DEV && (
                            <>
                                <Route path="/debug" element={<DebugPreviews />} />
                                <Route path="/debug/preview/:viewId" element={<DebugPreviewSingle />} />
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
                                element={<LobbyPage user={user} onCreateGame={createGame} />}
                            />
                            <Route
                                path={ROUTES.GAME}
                                element={
                                    <GameRouteHandler
                                        gameState={gameState}
                                        user={user}
                                        emit={emit}
                                        joinGame={joinGame}
                                        joinError={joinError}
                                        clearJoinError={clearJoinError}
                                        onOpenInstructions={() => setInstructionsOpen(true)}
                                        onStartGame={startGame}
                                        onEndGame={endGame}
                                        onPlayAgain={playAgain}
                                        onNextRound={nextRound}
                                        onMigrateGame={migrateGame}
                                        onLeaveGame={leaveGame}
                                        onVote={castVote}
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
    const { connected, gameState, emit, joinError, clearJoinError } = useSocket(user);
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
            />
        </BrowserRouter>
    );
}
