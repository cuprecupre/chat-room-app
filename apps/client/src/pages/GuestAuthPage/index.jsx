import { useNavigate } from "react-router-dom";
import { GuestAuthScreen } from "../../components/GuestAuthScreen";
import { ROUTES } from "../../routes/routes";

export function GuestAuthPage({ onLoginAsGuest, isLoading, error, clearError }) {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(ROUTES.HOME);
        if (clearError) clearError();
    };

    return (
        <GuestAuthScreen
            onLoginAsGuest={onLoginAsGuest}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
        />
    );
}
