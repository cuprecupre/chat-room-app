import { useTranslation } from "react-i18next";
import { SEO } from "../../components/SEO";
import { RulesPage as RulesPageComponent } from "../../components/RulesPage";

export function RulesPage() {
    const { t } = useTranslation('rules');

    return (
        <>
            <SEO
                title={t('meta.title')}
                description={t('meta.description')}
                path="/reglas"
            />
            <RulesPageComponent />
        </>
    );
}
