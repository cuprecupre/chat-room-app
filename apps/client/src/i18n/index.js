import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import commonES from './locales/es/common.json';
import landingES from './locales/es/landing.json';
import gameES from './locales/es/game.json';
import rulesES from './locales/es/rules.json';

import commonEN from './locales/en/common.json';
import landingEN from './locales/en/landing.json';
import gameEN from './locales/en/game.json';
import rulesEN from './locales/en/rules.json';

const resources = {
    es: {
        common: commonES,
        landing: landingES,
        game: gameES,
        rules: rulesES,
    },
    en: {
        common: commonEN,
        landing: landingEN,
        game: gameEN,
        rules: rulesEN,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'es',
        supportedLngs: ['es', 'en'], // Crucial for path detection to ignore non-language paths (e.g. /lobby)
        defaultNS: 'common',
        ns: ['common', 'landing', 'game', 'rules'],

        detection: {
            // Order of detection: URL path first, then localStorage, then browser
            order: ['path', 'localStorage', 'navigator'],
            lookupFromPathIndex: 0,
            // Cache user language in localStorage
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false, // React already escapes
        },

        react: {
            useSuspense: false, // Disable suspense to avoid hydration issues
        },
    });

export default i18n;
