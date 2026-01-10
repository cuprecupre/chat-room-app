import { useNavigate } from "react-router-dom";
import { EmailAuthScreen } from "../../components/EmailAuthScreen";
import { ROUTES } from "../../routes/routes";

export function EmailAuthPage({
    onLoginWithEmail,
    onRegisterWithEmail,
    isLoading,
    error,
    clearError,
    onBack,
}) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(ROUTES.HOME);
        }
        clearError();
    };

    return (
        <EmailAuthScreen
            onLoginWithEmail={onLoginWithEmail}
            onRegisterWithEmail={onRegisterWithEmail}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
        />
    );
}
