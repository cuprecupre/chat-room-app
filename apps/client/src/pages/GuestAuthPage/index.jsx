import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GuestAuthScreen } from "../../components/GuestAuthScreen";
import { LoginScreen } from "../../components/LoginScreen";
import { ROUTES } from "../../routes/routes";

export function GuestAuthPage({
    user,
    onLoginAsGuest,
    onLoginWithGoogle,
    onLinkWithGoogle,
    onLinkWithEmail,
    isLoading,
    error,
    clearError,
    onBack
}) {
    const navigate = useNavigate();
    const [view, setView] = useState("selection"); // "selection" | "guest-name"

    // Check if user is anonymous (upgrading account)
    const isUpgrading = user?.isAnonymous === true;

    // Detect successful guest login and redirect
    useEffect(() => {
        // If we were in the guest name entry view and the user is now authenticated as anonymous,
        // it means the login was successful.
        if (view === "guest-name" && user?.isAnonymous) {
            navigate(ROUTES.LOBBY || "/");
        }
    }, [user, view, navigate]);

    const handleBack = () => {
        if (view === "guest-name") {
            setView("selection");
            if (clearError) clearError();
            return;
        }

        if (isUpgrading) {
            // If upgrading, go back to profile
            navigate(ROUTES.PROFILE);
        } else if (onBack) {
            onBack();
        } else {
            navigate(ROUTES.HOME);
        }
        if (clearError) clearError();
    };

    const handleGoToEmailAuth = () => {
        // Pass isUpgrading state to EmailAuth
        navigate(ROUTES.AUTH, { state: { isUpgrading } });
    };

    const handleGoToGuestName = () => {
        setView("guest-name");
    };

    // Use linking function if upgrading, otherwise use login
    const handleGoogleAuth = async () => {
        if (isUpgrading && onLinkWithGoogle) {
            const success = await onLinkWithGoogle();
            if (success) {
                navigate(ROUTES.PROFILE);
            }
        } else {
            onLoginWithGoogle();
        }
    };

    if (view === "selection") {
        return (
            <LoginScreen
                onLogin={handleGoogleAuth}
                onGoToEmailAuth={handleGoToEmailAuth}
                onGoToGuestAuth={handleGoToGuestName}
                onBack={handleBack}
                isLoading={isLoading}
                isUpgrading={isUpgrading}
                error={error}
            />
        );
    }

    return (
        <GuestAuthScreen
            onLoginAsGuest={onLoginAsGuest}
            onLoginWithGoogle={handleGoogleAuth}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
        />
    );
}
