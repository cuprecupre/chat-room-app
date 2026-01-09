import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEO } from "../../components/SEO";
import { CookiesPolicyES } from "../../components/legal/CookiesPolicyES";
import { CookiesPolicyEN } from "../../components/legal/CookiesPolicyEN";

export function CookiesPage() {
    const { t, i18n } = useTranslation('common');
    const isEn = i18n.language.startsWith('en');

    // Title mapping
    const title = isEn ? "Cookie Policy" : "Política de Cookies";
    const backText = isEn ? "Back to home" : "Volver al inicio";

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 py-12 px-6 pb-64 md:pb-24 font-sans">
            <SEO
                title={title}
                description={isEn
                    ? "Cookie Policy for The Impostor game. Learn about the cookies we use."
                    : "Política de Cookies del juego El Impostor. Conoce qué cookies utilizamos."
                }
                path="/cookies"
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

                {isEn ? <CookiesPolicyEN /> : <CookiesPolicyES />}
            </div>
        </div>
    );
}
