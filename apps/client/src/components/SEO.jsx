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
            <title>{title ? `${title} | ${gameName}` : gameName}</title>
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
        </Helmet>
    );
}
