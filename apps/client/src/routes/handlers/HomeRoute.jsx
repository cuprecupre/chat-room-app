import { Navigate } from "react-router-dom";
import { useRoomIdFromUrl } from "../../hooks/useRoomIdFromUrl";
import { ROUTES } from "../routes.jsx";
import { LandingPage } from "../../pages/LandingPage";
import { InviteLandingPage } from "../../pages/InviteLandingPage";

/**
 * Home route handler - decides what to show based on auth state and URL params
 */
export function HomeRoute({
    user,
    login,
    loading,
    onOpenInstructions,
    onOpenFeedback,
}) {
    const roomId = useRoomIdFromUrl();

    // If there's a roomId and user is NOT logged in, show InviteLandingPage
    if (roomId && !user) {
        return <InviteLandingPage onLogin={login} isLoading={loading} />;
    }

    // If user is logged in with roomId, redirect to game
    if (user && roomId) {
        return <Navigate to={`${ROUTES.GAME}?roomId=${roomId}`} replace />;
    }

    // If user is logged in without roomId, redirect to lobby
    if (user) {
        return <Navigate to={ROUTES.LOBBY} replace />;
    }

    // Default: show landing page for unauthenticated users
    return (
        <LandingPage
            onLogin={login}
            isLoading={loading}
            onOpenInstructions={onOpenInstructions}
            onOpenFeedback={onOpenFeedback}
        />
    );
}
