import { Navigate, useLocation } from "react-router-dom";
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
    recoverPassword,
    linkWithEmail,
    linkWithGoogle, // New prop
    login, // New prop for Google Login
    loading,
    error,
    clearError,
    onBack,
}) {
    const roomId = useRoomIdFromUrl();
    const location = useLocation();
    const isUpgrading = location.state?.isUpgrading === true || user?.isAnonymous === true;

    // If user is already authenticated and NOT anonymous, redirect
    if (user && !user.isAnonymous) {
        // Redirect to game if there's a roomId
        if (roomId) {
            return <Navigate to={`${ROUTES.GAME}?roomId=${roomId}`} replace />;
        }
        // Otherwise redirect to lobby
        return <Navigate to={ROUTES.LOBBY} replace />;
    }

    // Show email auth page for unauthenticated users OR anonymous users wanting to upgrade
    return (
        <EmailAuthPage
            user={user}
            onLoginWithEmail={loginWithEmail}
            onRegisterWithEmail={registerWithEmail}
            onLinkWithEmail={linkWithEmail}
            onLinkWithGoogle={linkWithGoogle}
            onLoginWithGoogle={login}
            onRecoverPassword={recoverPassword}
            isLoading={loading}
            error={error}
            clearError={clearError}
            onBack={onBack}
            isUpgrading={isUpgrading}
        />
    );
}
