import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GuestAuthScreen } from "../../components/GuestAuthScreen";
import { LoginScreen } from "../../components/LoginScreen";
import { ROUTES } from "../../routes/routes";

export function GuestAuthPage({ onLoginAsGuest, onLoginWithGoogle, isLoading, error, clearError, onBack }) {
    const navigate = useNavigate();
    const [view, setView] = useState("selection"); // "selection" | "guest-name"

    const handleBack = () => {
        if (view === "guest-name") {
            setView("selection");
            if (clearError) clearError();
            return;
        }

        if (onBack) {
            onBack();
        } else {
            navigate(ROUTES.HOME);
        }
        if (clearError) clearError();
    };

    const handleGoToEmailAuth = () => {
        navigate(ROUTES.AUTH);
    };

    const handleGoToGuestName = () => {
        setView("guest-name");
    };

    if (view === "selection") {
        return (
            <LoginScreen
                onLogin={onLoginWithGoogle}
                onGoToEmailAuth={handleGoToEmailAuth}
                onGoToGuestAuth={handleGoToGuestName}
                onBack={handleBack}
                isLoading={isLoading}
            />
        );
    }

    return (
        <GuestAuthScreen
            onLoginAsGuest={onLoginAsGuest}
            onLoginWithGoogle={onLoginWithGoogle}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
        />
    );
}
