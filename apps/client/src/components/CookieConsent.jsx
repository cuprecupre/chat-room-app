import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_VERSION = '1'; // Increment when policy changes significantly

export function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Check if user has already given consent
        const consent = localStorage.getItem(CONSENT_KEY);
        if (!consent) {
            // Small delay to avoid flash on page load
            const timer = setTimeout(() => setShowBanner(true), 1000);
            return () => clearTimeout(timer);
        }

        // Check if consent version is outdated
        try {
            const parsed = JSON.parse(consent);
            if (parsed.version !== CONSENT_VERSION) {
                setShowBanner(true);
            }
        } catch {
            setShowBanner(true);
        }
    }, []);

    const saveConsent = (analytics, advertising) => {
        const consent = {
            version: CONSENT_VERSION,
            analytics,
            advertising,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
        setShowBanner(false);

        // If analytics accepted and GTM is available, signal consent
        if (analytics && window.dataLayer) {
            window.dataLayer.push({
                event: 'consent_update',
                analytics_consent: analytics,
                ad_consent: advertising
            });
        }

        // Reload to apply consent (GTM/AdSense will check consent on load)
        if (analytics || advertising) {
            window.location.reload();
        }
    };

    const acceptAll = () => {
        saveConsent(true, true);
    };

    const acceptNecessaryOnly = () => {
        saveConsent(false, false);
    };

    const saveCustom = (analytics, advertising) => {
        saveConsent(analytics, advertising);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slideUp">
            <div className="w-full bg-white border-t border-neutral-200 shadow-2xl overflow-hidden">
                <div className="p-4 md:px-8 md:py-4">
                    {/* Desktop: flex row, Mobile: flex col */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Text - Left side */}
                        <div className="md:flex-1">
                            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                                Utilizamos cookies 🍪 para mejorar tu experiencia, analizar el uso del sitio y mostrarte
                                publicidad relevante.{' '}
                                <Link
                                    to="/privacidad"
                                    className="text-orange-600 hover:text-orange-700 underline"
                                >
                                    Privacidad
                                </Link>
                                {' · '}
                                <Link
                                    to="/cookies"
                                    className="text-orange-600 hover:text-orange-700 underline"
                                >
                                    Cookies
                                </Link>
                            </p>
                        </div>

                        {/* Buttons - Right side
                            Desktop: Personalizar → Rechazar → Aceptar
                            Mobile: Aceptar → Rechazar → Personalizar (usando order) */}
                        <div className="flex flex-col sm:flex-row gap-2 md:flex-shrink-0">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="order-3 sm:order-1 px-4 py-2 border border-neutral-300 hover:border-neutral-400 text-neutral-600 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                            >
                                {showDetails ? 'Ocultar' : 'Personalizar cookies'}
                            </button>
                            <button
                                onClick={acceptNecessaryOnly}
                                className="order-2 sm:order-2 px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                            >
                                Aceptar las esenciales
                            </button>
                            <button
                                onClick={acceptAll}
                                className="order-1 sm:order-3 px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                            >
                                Aceptar todas
                            </button>
                        </div>
                    </div>
                </div>

                {/* Details Panel */}
                {showDetails && (
                    <CookieDetails onSave={saveCustom} onClose={() => setShowDetails(false)} />
                )}
            </div>
        </div>
    );
}

function CookieDetails({ onSave, onClose }) {
    const [analytics, setAnalytics] = useState(true);
    const [advertising, setAdvertising] = useState(true);

    return (
        <div className="border-t border-neutral-200 p-4 md:px-8 md:py-4 bg-neutral-50">
            {/* Desktop: 4 columns (3 options + save button), Mobile: stacked */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Option 1: Necessary */}
                <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg md:flex-1">
                    <div>
                        <p className="text-sm font-medium text-neutral-800">Cookies necesarias</p>
                        <p className="text-xs text-neutral-500">Imprescindibles</p>
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">Siempre activas</span>
                </div>

                {/* Option 2: Analytics */}
                <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg md:flex-1">
                    <div>
                        <p className="text-sm font-medium text-neutral-800">Analítica</p>
                        <p className="text-xs text-neutral-500">Google Analytics, Smartlook - Estadísticas de uso</p>
                    </div>
                    <button
                        onClick={() => setAnalytics(!analytics)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analytics ? 'bg-green-500' : 'bg-neutral-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analytics ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Option 3: Advertising */}
                <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg md:flex-1">
                    <div>
                        <p className="text-sm font-medium text-neutral-800">Publicidad</p>
                        <p className="text-xs text-neutral-500">Google AdSense</p>
                    </div>
                    <button
                        onClick={() => setAdvertising(!advertising)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advertising ? 'bg-green-500' : 'bg-neutral-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advertising ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Save Button - 4th column on desktop */}
                <button
                    onClick={() => onSave(analytics, advertising)}
                    className="w-full md:w-auto px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                    Guardar preferencias
                </button>
            </div>
        </div>
    );
}

// Helper to check if user has consented to a specific type
export function hasConsent(type) {
    try {
        const consent = localStorage.getItem(CONSENT_KEY);
        if (!consent) return false;
        const parsed = JSON.parse(consent);
        return parsed[type] === true;
    } catch {
        return false;
    }
}

// Helper to check if user has made any choice
export function hasConsentChoice() {
    return localStorage.getItem(CONSENT_KEY) !== null;
}
