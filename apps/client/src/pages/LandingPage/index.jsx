import { useNavigate } from "react-router-dom";
import { LandingPage as LandingPageComponent } from "../../components/LandingPage";
import { ROUTES } from "../../routes/routes";

export function LandingPage({ onLogin, isLoading, onOpenInstructions, onOpenFeedback }) {
    const navigate = useNavigate();

    const handleGoToEmailAuth = () => {
        navigate(ROUTES.AUTH);
    };

    const handleGoToGuestAuth = () => {
        navigate(ROUTES.GUEST_AUTH);
    };

    return (
        <LandingPageComponent
            onLogin={onLogin}
            onGoToEmailAuth={handleGoToEmailAuth}
            onGoToGuestAuth={handleGoToGuestAuth}
            isLoading={isLoading}
            onOpenInstructions={onOpenInstructions}
            onOpenFeedback={onOpenFeedback}
        />
    );
}
