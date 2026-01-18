import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, lazy } from "react";
import { useTranslation } from "react-i18next";
import { HelmetProvider } from "react-helmet-async";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { useGameActions } from "../hooks/useGameActions";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { Toaster } from "../components/Toaster";
import { Spinner } from "../components/ui/Spinner";
import { InstructionsModal } from "../components/InstructionsModal";
import { FeedbackModal } from "../components/FeedbackModal";
import { ShutdownToast } from "../components/ShutdownToast";
import { PlayerStatsProvider } from "../context/PlayerStatsContext";
import { MainLayout } from "../layouts/MainLayout";
import { UnauthenticatedLayout } from "../layouts/UnauthenticatedLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminProtectedRoute } from "./AdminProtectedRoute";
import { ROUTES } from "./routes";
import { HomeRoute, AuthRoute, GuestAuthRoute, GameRoute } from "./handlers";
import DebugPreviews from "../pages/DebugPreviews";
import DebugPreviewSingle from "../pages/DebugPreviewSingle";

// Lazy load pages for code splitting & faster initial load
const LobbyPage = lazy(() => import("../pages/LobbyPage").then(module => ({ default: module.LobbyPage })));
const RulesPage = lazy(() => import("../pages/RulesPage").then(module => ({ default: module.RulesPage })));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage").then(module => ({ default: module.PrivacyPage })));
const CookiesPage = lazy(() => import("../pages/CookiesPage").then(module => ({ default: module.CookiesPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then(module => ({ default: module.ProfilePage })));
const SetupProfilePage = lazy(() => import("../pages/SetupProfilePage").then(module => ({ default: module.SetupProfilePage })));
const AdminIndex = lazy(() => import("../pages/Admin").then(module => ({ default: module.AdminIndex })));

// Local hero image (Self-hosted to prevent FOUC/Flicker)
const heroImg = "/images/impostor-home.jpg";

function AppRoutes({
    user,
    loading,
    error,
    login,
    loginWithEmail,
    registerWithEmail,
    loginAsGuest,
    logout,
    recoverPassword,
    linkWithGoogle,
    linkWithEmail,
    clearError,
    connected,
    gameState,
    emit,
    joinError,
    clearJoinError,
    shutdownCountdown,
    socketRef,
    needsProfileSetup,
    setNeedsProfileSetup,
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
        endMatch,
        nextRound,
        leaveMatch,
        leaveRoom,
        kickPlayer,
        castVote,
        submitClue,
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
        const wasInLobby = location.pathname === ROUTES.LOBBY || location.pathname === "/en/lobby";

        // If a new room ID appears and we're in the lobby, navigate to game
        // Note: Protected routes handle regex/paths, but better to keep simple redirect
        if (currentRoomId && currentRoomId !== prevRoomIdRef.current && wasInLobby) {
            const isEnglish = location.pathname.startsWith('/en');
            // Always redirect to base game route, let language persist via state/cookie
            // Or if implementing strict /en/game, would add check here. 
            // For now, game routes are language-agnostic in URL (lang persists in memory)
            navigate(`${ROUTES.GAME}?roomId=${currentRoomId}`);
        }

        prevRoomIdRef.current = currentRoomId;
    }, [gameState?.roomId, location.pathname, navigate]);

    const handleGoToGuestAuth = () => {
        const isEnglish = location.pathname.startsWith('/en');
        navigate(isEnglish ? '/en/guest' : ROUTES.GUEST_AUTH);
    };

    const handleBackToHome = () => {
        const isEnglish = location.pathname.startsWith('/en');
        navigate(isEnglish ? '/en' : ROUTES.HOME);
    };

    // Props for different route groups
    const publicRouteProps = {
        user,
        login,
        loading,
        onOpenInstructions: openInstructions,
        onOpenFeedback: openFeedback,
        onGoToGuestAuth: handleGoToGuestAuth,
    };

    const authRouteProps = {
        user,
        loginWithEmail,
        login,
        registerWithEmail,
        recoverPassword,
        loginAsGuest,
        linkWithGoogle,
        linkWithEmail,
        loading,
        error,
        clearError,
        onBack: handleBackToHome,
    };

    const protectedRouteProps = {
        user,
        connected,
        emit,
        gameState,
        needsProfileSetup,
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
        joinGameError: joinError, // Legacy prop name support if needed
        clearJoinError,
        onOpenInstructions: openInstructions,
        onStartGame: startMatch,
        onUpdateOptions: updateOptions,
        onPlayAgain: playAgain,
        onEndMatch: endMatch,
        onNextRound: nextRound,
        onLeaveRoom: leaveRoom,
        onLeaveMatch: leaveMatch,
        onVote: castVote,
        onSubmitClue: submitClue,
        onKickPlayer: kickPlayer,
    };

    return (
        <>
            <Toaster />
            <ShutdownToast shutdownCountdown={shutdownCountdown} />
            <InstructionsModal isOpen={instructionsOpen} onClose={closeInstructions} />
            <FeedbackModal isOpen={feedbackOpen} onClose={closeFeedback} user={user} />

            <Routes>
                {/* ==================== PUBLIC ROUTES (ES - Default) ==================== */}
                <Route element={<UnauthenticatedLayout />}>
                    <Route path={ROUTES.HOME} element={<RootHandler><HomeRoute {...publicRouteProps} /></RootHandler>} />
                    <Route path={ROUTES.AUTH} element={<AuthRoute {...authRouteProps} />} />
                    <Route path={ROUTES.GUEST_AUTH} element={<GuestAuthRoute {...authRouteProps} />} />
                    <Route path={ROUTES.RULES} element={<RulesPage />} />
                    <Route path="/privacidad" element={<PrivacyPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />

                    {/* ==================== PUBLIC ROUTES (EN) ==================== */}
                    <Route path="/en" element={<HomeRoute {...publicRouteProps} />} />
                    <Route path="/en/auth" element={<AuthRoute {...authRouteProps} />} />
                    <Route path="/en/guest" element={<GuestAuthRoute {...authRouteProps} />} />
                    <Route path="/en/rules" element={<RulesPage />} />
                    <Route path="/en/privacy" element={<PrivacyPage />} />
                    <Route path="/en/cookies" element={<CookiesPage />} />

                    {import.meta.env.DEV && (
                        <>
                            <Route path="/debug" element={<DebugPreviews />} />
                            <Route path="/debug/preview/:viewId" element={<DebugPreviewSingle />} />
                        </>
                    )}
                </Route>

                {/* ==================== PROTECTED ROUTES ==================== */}
                {/* Protected routes do not enforce language in URL, they use current state */}
                <Route element={<ProtectedRoute {...protectedRouteProps} />}>
                    <Route element={
                        <PlayerStatsProvider uid={user?.uid} socketRef={socketRef}>
                            <MainLayout {...layoutProps} />
                        </PlayerStatsProvider>
                    }>
                        <Route
                            path={ROUTES.LOBBY}
                            element={<LobbyPage user={user} onCreateGame={createRoom} />}
                        />
                        <Route path={ROUTES.GAME} element={<GameRoute {...gameRouteProps} />} />
                        <Route path={ROUTES.PROFILE} element={<ProfilePage gameState={gameState} />} />
                        <Route path={ROUTES.SETUP_PROFILE} element={<SetupProfilePage gameState={gameState} />} />
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
                <Route path="*" element={<SmartRedirect />} />
            </Routes>
        </>
    );
}

// Helper for language-aware redirects
function SmartRedirect() {
    const { i18n } = useTranslation();
    const isEnglish = i18n.language.startsWith('en');
    const target = isEnglish ? "/en" : "/";
    return <Navigate to={target} replace />;
}

// Root handler for automatic language-based redirect
// - If user's i18n language is 'en', redirect to '/en' for SEO
// - Otherwise render Spanish content directly
// - Does NOT change language state - only handles URL routing
function RootHandler({ children }) {
    const { i18n } = useTranslation();
    const location = useLocation();

    // If user's language preference is English, redirect to /en path for SEO
    // The i18n state is the source of truth, we just adjust the URL
    if (i18n.language?.startsWith('en')) {
        const target = `/en${location.search}`;
        return <Navigate to={target} replace />;
    }

    // Spanish users stay on / path
    return children;
}

export function AppRouter() {
    const { t } = useTranslation('common');
    const {
        user,
        loading,
        error,
        login,
        loginWithEmail,
        registerWithEmail,
        loginAsGuest,
        logout,
        recoverPassword,
        linkWithGoogle,
        linkWithEmail,
        needsProfileSetup,
        setNeedsProfileSetup,
        clearError,
    } = useAuth();
    const { connected, gameState, emit, joinError, clearJoinError, shutdownCountdown, socketRef } =
        useSocket(user);


    // Optimized loader: Always show immediately when loading to prevent flickering
    // effectively eliminating the white flash between auth states
    if (loading) {
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
                            <p>{t('system.authenticating', 'Autenticando')}</p>
                            <p className="text-sm text-neutral-400 mt-1">{t('system.verifyingSession', 'Verificando sesión...')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <HelmetProvider>
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
                    recoverPassword={recoverPassword}
                    linkWithGoogle={linkWithGoogle}
                    linkWithEmail={linkWithEmail}
                    clearError={clearError}
                    connected={connected}
                    gameState={gameState}
                    emit={emit}
                    joinError={joinError}
                    clearJoinError={clearJoinError}
                    shutdownCountdown={shutdownCountdown}
                    socketRef={socketRef}
                    needsProfileSetup={needsProfileSetup}
                    setNeedsProfileSetup={setNeedsProfileSetup}
                />
            </BrowserRouter>
        </HelmetProvider>
    );
}
