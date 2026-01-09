import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from "../../components/SEO";
import { PrivacyPolicyES } from "../../components/legal/PrivacyPolicyES";
import { PrivacyPolicyEN } from "../../components/legal/PrivacyPolicyEN";

export function PrivacyPage() {
    const { t, i18n } = useTranslation('common');
    const isEn = i18n.language.startsWith('en');

    // Title mapping (could also be in i18n json)
    const title = isEn ? "Privacy Policy" : "Política de Privacidad";
    const backText = isEn ? "Back to home" : "Volver al inicio";

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 py-12 px-6 pb-64 md:pb-24 font-sans">
            <SEO
                title={title}
                description={isEn
                    ? "Privacy Policy for The Impostor game. Learn how we handle your data."
                    : "Política de Privacidad del juego El Impostor. Conoce cómo tratamos tus datos."
                }
                path="/privacidad"
            />

            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <Link
                    to={isEn ? "/en" : "/"}
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {backText}
                </Link>

                <h1 className="text-4xl font-serif text-white mb-8">{title}</h1>

                {isEn ? <PrivacyPolicyEN /> : <PrivacyPolicyES />}
            </div>
        </div>
    );
}
