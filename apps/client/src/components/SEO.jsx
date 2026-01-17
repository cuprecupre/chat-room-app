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
    const baseUrl = "https://impostor.me";

    // Normalize path: remove leading slash and any '/en' prefix (path should be Spanish base path)
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Remove 'en/' or 'en' prefix if accidentally passed (path should be Spanish path only)
    if (cleanPath === 'en' || cleanPath.startsWith('en/')) {
        cleanPath = cleanPath === 'en' ? '' : cleanPath.slice(3);
    }
    // Remove trailing slash
    cleanPath = cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;

    // Construct URLs - Spanish is always base, English adds /en prefix
    const esUrl = cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
    const enUrl = cleanPath ? `${baseUrl}/en/${cleanPath}` : `${baseUrl}/en`;

    // Current URL based on language (for OG tags and social sharing)
    const currentUrl = currentLang === 'en' ? enUrl : esUrl;

    // ALWAYS use Spanish as canonical to consolidate SEO authority
    const canonicalUrl = esUrl;

    return (
        <Helmet>
            <html lang={currentLang} />
            <title>{title || gameName}</title>
            <meta name="description" content={description} />

            {/* Geographic Targeting */}
            <meta name="geo.region" content={currentLang === 'es' ? 'ES' : 'US'} />

            {/* Content Language - reinforces primary language signal */}
            <meta httpEquiv="content-language" content="es, en" />

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

            {/* Canonical - ALWAYS points to Spanish version */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Hreflang with regional variants for better geographic targeting */}
            <link rel="alternate" hreflang="x-default" href={esUrl} />
            <link rel="alternate" hreflang="es" href={esUrl} />
            <link rel="alternate" hreflang="es-ES" href={esUrl} />
            <link rel="alternate" hreflang="es-MX" href={esUrl} />
            <link rel="alternate" hreflang="es-AR" href={esUrl} />
            <link rel="alternate" hreflang="en" href={enUrl} />
            <link rel="alternate" hreflang="en-US" href={enUrl} />
            <link rel="alternate" hreflang="en-GB" href={enUrl} />

            {/* Structured Data (JSON-LD) - Spanish always primary */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "El Impostor",
                    "alternateName": ["El Impostor Online", "Juego del Impostor", "The Impostor Game"],
                    "url": "https://impostor.me/",
                    "inLanguage": ["es", "en"],
                    "availableLanguage": [
                        {
                            "@type": "Language",
                            "name": "Spanish",
                            "alternateName": "es"
                        },
                        {
                            "@type": "Language",
                            "name": "English",
                            "alternateName": "en"
                        }
                    ]
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
                    "inLanguage": ["es", "en"],
                    "availableLanguage": ["es", "en"]
                })}
            </script>
        </Helmet>
    );
}
