import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmailAuthScreen } from "../../components/EmailAuthScreen";
import { LoginScreen } from "../../components/LoginScreen";
import { ROUTES } from "../../routes/routes";

export function EmailAuthPage({
    onLoginWithEmail,
    onRegisterWithEmail,
    onLinkWithEmail,
    onRecoverPassword,
    onLoginWithGoogle, // Added prop for Google Login
    onLinkWithGoogle,  // Added prop for Google Linking
    isLoading,
    error,
    clearError,
    onBack,
    isUpgrading = false,
}) {
    const navigate = useNavigate();
    const [view, setView] = useState("selection"); // "selection" | "email"

    const handleBackFromSelection = () => {
        if (clearError) clearError();
        // If coming from profile (upgrading), go back to profile
        if (isUpgrading) {
            navigate(ROUTES.PROFILE);
        } else if (onBack) {
            onBack();
        } else {
            navigate(ROUTES.HOME);
        }
    };

    const handleBackFromEmail = () => {
        if (clearError) clearError();
        setView("selection");
    };

    const handleSuccess = () => {
        // If upgrading was successful, navigate to profile
        if (isUpgrading) {
            navigate(ROUTES.PROFILE);
        }
    };

    const handleGoogleAuth = async () => {
        if (isUpgrading && onLinkWithGoogle) {
            const success = await onLinkWithGoogle();
            if (success) {
                navigate(ROUTES.PROFILE);
            }
        } else if (onLoginWithGoogle) {
            onLoginWithGoogle();
        }
    };

    const handleGoToEmail = () => {
        setView("email");
    };

    const handleGoToGuest = () => {
        navigate(ROUTES.GUEST_AUTH);
    };

    if (view === "selection") {
        return (
            <LoginScreen
                onLogin={handleGoogleAuth}
                onGoToEmailAuth={handleGoToEmail}
                onGoToGuestAuth={handleGoToGuest}
                onBack={handleBackFromSelection}
                isLoading={isLoading}
                isUpgrading={isUpgrading}
                error={error}
            />
        );
    }

    return (
        <EmailAuthScreen
            onLoginWithEmail={onLoginWithEmail}
            onRegisterWithEmail={onRegisterWithEmail}
            onLinkWithEmail={onLinkWithEmail}
            onRecoverPassword={onRecoverPassword}
            onBack={handleBackFromEmail}
            onSuccess={handleSuccess}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
            isUpgrading={isUpgrading}
        />
    );
}
