import { useNavigate } from "react-router-dom";
import { EmailAuthScreen } from "../../components/EmailAuthScreen";
import { ROUTES } from "../../routes/routes";

export function EmailAuthPage({
    onLoginWithEmail,
    onRegisterWithEmail,
    onLinkWithEmail,
    onRecoverPassword,
    isLoading,
    error,
    clearError,
    onBack,
    isUpgrading = false,
}) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (clearError) clearError();
        // If upgrading, go back to Guest Auth selection screen with upgrading state
        if (isUpgrading) {
            navigate(ROUTES.GUEST_AUTH, { state: { isUpgrading: true } });
        } else {
            navigate(ROUTES.GUEST_AUTH);
        }
    };

    const handleSuccess = () => {
        // If upgrading was successful, navigate to profile
        if (isUpgrading) {
            navigate(ROUTES.PROFILE);
        }
    };

    return (
        <EmailAuthScreen
            onLoginWithEmail={onLoginWithEmail}
            onRegisterWithEmail={onRegisterWithEmail}
            onLinkWithEmail={onLinkWithEmail}
            onRecoverPassword={onRecoverPassword}
            onBack={handleBack}
            onSuccess={handleSuccess}
            isLoading={isLoading}
            error={error}
            clearError={clearError}
            isUpgrading={isUpgrading}
        />
    );
}
