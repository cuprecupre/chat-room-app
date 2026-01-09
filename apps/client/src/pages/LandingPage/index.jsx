import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/SEO";
import { LandingPage as LandingPageComponent } from "../../components/LandingPage";
import { ROUTES } from "../../routes/routes";

export function LandingPage({ onLogin, isLoading, onOpenInstructions, onOpenFeedback }) {
    const navigate = useNavigate();
    const { t } = useTranslation('landing');

    const handleGoToEmailAuth = () => {
        navigate(ROUTES.AUTH);
    };

    const handleGoToGuestAuth = () => {
        navigate(ROUTES.GUEST_AUTH);
    };

    return (
        <>
            <SEO
                title={t('landing:meta.title')}
                description={t('landing:meta.description')}
                path="/"
            />
            <LandingPageComponent
                onLogin={onLogin}
                onGoToEmailAuth={handleGoToEmailAuth}
                onGoToGuestAuth={handleGoToGuestAuth}
                isLoading={isLoading}
                onOpenInstructions={onOpenInstructions}
                onOpenFeedback={onOpenFeedback}
            />
        </>
    );
}
