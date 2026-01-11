import { Navigate } from "react-router-dom";
import { useRoomIdFromUrl } from "../../hooks/useRoomIdFromUrl";
import { ROUTES } from "../routes.jsx";
import { GuestAuthPage } from "../../pages/GuestAuthPage";

/**
 * Guest auth route handler - shows guest auth page or redirects if already logged in
 */
export function GuestAuthRoute({
    user,
    login,
    loginAsGuest,
    loading,
    error,
    clearError,
    onBack,
}) {
    const roomId = useRoomIdFromUrl();

    // If user is already authenticated
    if (user) {
        // Redirect to game if there's a roomId
        if (roomId) {
            return <Navigate to={`${ROUTES.GAME}?roomId=${roomId}`} replace />;
        }
        // Otherwise redirect to lobby
        return <Navigate to={ROUTES.LOBBY} replace />;
    }

    // Show guest auth page for unauthenticated users
    return (
        <GuestAuthPage
            onLoginAsGuest={loginAsGuest}
            onLoginWithGoogle={login}
            isLoading={loading}
            error={error}
            clearError={clearError}
            onBack={onBack}
        />
    );
}
