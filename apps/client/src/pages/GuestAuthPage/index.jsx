import { useNavigate } from "react-router-dom";
import { GuestAuthScreen } from "../../components/GuestAuthScreen";
import { ROUTES } from "../../routes/routes";

export function GuestAuthPage({ onLoginAsGuest, onLoginWithGoogle, isLoading, error, clearError, onBack }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(ROUTES.HOME);
        }
        if (clearError) clearError();
    };

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
