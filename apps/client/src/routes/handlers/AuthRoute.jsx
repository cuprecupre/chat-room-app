import { Navigate } from "react-router-dom";
import { useRoomIdFromUrl } from "../../hooks/useRoomIdFromUrl";
import { ROUTES } from "../routes.jsx";
import { EmailAuthPage } from "../../pages/EmailAuthPage";

/**
 * Email auth route handler - shows auth page or redirects if already logged in
 */
export function AuthRoute({
    user,
    loginWithEmail,
    registerWithEmail,
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

    // Show email auth page for unauthenticated users
    return (
        <EmailAuthPage
            onLoginWithEmail={loginWithEmail}
            onRegisterWithEmail={registerWithEmail}
            isLoading={loading}
            error={error}
            clearError={clearError}
            onBack={onBack}
        />
    );
}
