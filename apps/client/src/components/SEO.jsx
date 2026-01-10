import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export function SEO({ title, description, path = "" }) {
    const { i18n, t } = useTranslation('common');
    const location = useLocation();
    const currentLang = i18n.language.startsWith('en') ? 'en' : 'es';
    const gameName = currentLang === 'en' ? 'The Impostor' : 'El Impostor';

    // Base URL (should be environment variable, but hardcoding provided domain for now)
    const baseUrl = "https://impostor-app.onrender.com"; // Assuming render URL or actual custom domain

    // Normalize path to not include leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Construct URLs
    const esUrl = `${baseUrl}/${cleanPath}`;
    const enUrl = `${baseUrl}/en/${cleanPath}`;

    // Current URL based on language
    const currentUrl = currentLang === 'en' ? enUrl : esUrl;

    return (
        <Helmet>
            <html lang={currentLang} />
            <title>{title || gameName}</title>
            <meta name="description" content={description} />

            {/* Open Graph */}
            <meta property="og:title" content={title || gameName} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:locale" content={currentLang === 'en' ? 'en_US' : 'es_ES'} />
            <meta property="og:locale:alternate" content={currentLang === 'en' ? 'es_ES' : 'en_US'} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title || gameName} />
            <meta name="twitter:description" content={description} />

            {/* Hreflang */}
            <link rel="alternate" hreflang="es" href={esUrl} />
            <link rel="alternate" hreflang="en" href={enUrl} />
            <link rel="canonical" href={currentUrl} />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "El Impostor",
                    "alternateName": ["El Impostor Online", "The Impostor Game"],
                    "url": "https://impostor.me/"
                })}
            </script>

            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Game",
                    "name": currentLang === 'en' ? "The Impostor Online" : "El Impostor Online",
                    "url": "https://impostor.me/",
                    "description": currentLang === 'en'
                        ? "Play Impostor online for free with friends. The impostor game in your browser without downloads."
                        : "Juega al impostor online gratis con amigos. El juego del impostor en tu navegador sin descargar.",
                    "genre": currentLang === 'en'
                        ? ["Impostor Game", "Online Game", "Multiplayer", "Browser Game"]
                        : ["Juego Impostor", "Juego Online", "Multijugador", "Juego Navegador"],
                    "gamePlatform": "Web Browser",
                    "applicationCategory": "Game",
                    "numberOfPlayers": {
                        "@type": "QuantitativeValue",
                        "minValue": 4,
                        "maxValue": 100
                    },
                    "playMode": "MultiPlayer",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "EUR",
                        "availability": "https://schema.org/InStock"
                    },
                    "inLanguage": currentLang
                })}
            </script>
        </Helmet>
    );
}
