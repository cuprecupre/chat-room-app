import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const languages = [
    { code: 'es', flag: '🇪🇸', name: 'Español', shortCode: 'ES' },
    { code: 'en', flag: '🇺🇸', name: 'English', shortCode: 'EN' },
];

export function LanguageSelector({ className = '' }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = languages.find(l => i18n.language?.startsWith(l.code)) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        // Use 'click' instead of 'mousedown' to allow button onClick to fire first
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = async (langCode) => {
        // Wait for language change to complete (updates localStorage)
        await i18n.changeLanguage(langCode);
        setIsOpen(false);

        // Update URL if on public pages
        const path = location.pathname;
        const isEnglishPath = path.startsWith('/en');

        // Define route mappings for public pages
        // Format: [CommonKey]: { es: '/path', en: '/en/path' }
        const routeMap = {
            home: { es: '/', en: '/en' },
            rules: { es: '/reglas', en: '/en/rules' },
            privacy: { es: '/privacidad', en: '/en/privacy' },
            cookies: { es: '/cookies', en: '/en/cookies' },
            auth: { es: '/auth', en: '/en/auth' },
            guest: { es: '/guest', en: '/en/guest' }
        };

        // Find current route key
        let currentRouteKey = null;
        if (path === '/' || path === '/en' || path === '/en/') currentRouteKey = 'home';
        else if (path === '/reglas' || path === '/en/rules') currentRouteKey = 'rules';
        else if (path === '/privacidad' || path === '/en/privacy') currentRouteKey = 'privacy';
        else if (path === '/cookies' || path === '/en/cookies') currentRouteKey = 'cookies';
        else if (path === '/auth' || path === '/en/auth') currentRouteKey = 'auth';
        else if (path === '/guest' || path === '/en/guest') currentRouteKey = 'guest';

        if (currentRouteKey) {
            const targetPath = routeMap[currentRouteKey][langCode];
            navigate(targetPath);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-200"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-base">{currentLang.flag}</span>
                <span className="text-sm font-medium text-neutral-200 hidden sm:inline">{currentLang.shortCode}</span>
                <svg
                    className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-950/95 backdrop-blur-md border border-white/10 ring-1 ring-white/10 rounded-xl shadow-2xl z-50 animate-fadeIn p-2">
                    {languages.map((lang) => (
                        <button
                            type="button"
                            key={lang.code}
                            onClick={() => handleChange(lang.code)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 rounded-md transition-colors ${i18n.language?.startsWith(lang.code) ? 'text-orange-400 bg-white/5' : 'text-neutral-200'
                                }`}
                            role="option"
                            aria-selected={i18n.language?.startsWith(lang.code)}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span className="text-sm font-medium flex-1">{lang.name}</span>
                            {i18n.language?.startsWith(lang.code) && (
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
