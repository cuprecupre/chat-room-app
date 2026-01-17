import "@testing-library/jest-dom";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import commonES from "../i18n/locales/es/common.json";
import gameES from "../i18n/locales/es/game.json";

// Initialize i18n for tests
i18n.use(initReactI18next).init({
    lng: "es",
    fallbackLng: "es",
    ns: ["common", "game"],
    defaultNS: "common",
    resources: {
        es: {
            common: commonES,
            game: gameES,
        },
    },
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

// Mock for window.matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
    }),
});

// Mock for ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock for scrollTo
window.scrollTo = () => { };

// Silence console.log during tests (optional)
// global.console = {
//     ...console,
//     log: () => {},
// };
