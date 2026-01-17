import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/SEO";
import { LandingPage as LandingPageComponent } from "../../components/LandingPage";
import { ROUTES } from "../../routes/routes";

export function LandingPage({
    onLogin,
    isLoading,
    onOpenInstructions,
    onOpenFeedback,
    onGoToGuestAuth,
}) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('landing');

    const isEn = i18n.language.startsWith('en');

    const handleGoToEmailAuth = () => {
        navigate(ROUTES.AUTH);
    };

    const handleGoToGuestAuth = () => {
        if (onGoToGuestAuth) {
            onGoToGuestAuth();
        } else {
            navigate(ROUTES.GUEST_AUTH);
        }
    };

    return (
        <>
            <SEO
                title={t('meta.title')}
                description={t('meta.description')}
                path=""
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
