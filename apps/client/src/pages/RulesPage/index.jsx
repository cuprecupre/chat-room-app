import { useTranslation } from "react-i18next";
import { SEO } from "../../components/SEO";
import { RulesPage as RulesPageComponent } from "../../components/RulesPage";

export function RulesPage() {
    const { t, i18n } = useTranslation('rules');
    const isEn = i18n.language.startsWith('en');

    return (
        <>
            <SEO
                title={t('meta.title')}
                description={t('meta.description')}
                path={isEn ? '/en/rules' : '/reglas'}
            />
            <RulesPageComponent />
        </>
    );
}
