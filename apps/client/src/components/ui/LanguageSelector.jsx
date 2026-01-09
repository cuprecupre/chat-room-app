import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'es', flag: '🇪🇸', name: 'Español', shortCode: 'ES' },
    { code: 'en', flag: '🇺🇸', name: 'English', shortCode: 'EN' },
];

export function LanguageSelector({ className = '' }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (langCode) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);

        // Update URL if on public pages
        const path = window.location.pathname;
        const isEnglishPath = path.startsWith('/en');
        const isPublicPage = path === '/' || path === '/en' || path === '/en/' ||
            path.startsWith('/reglas') || path.startsWith('/en/rules');

        if (isPublicPage) {
            if (langCode === 'en' && !isEnglishPath) {
                const newPath = path === '/' ? '/en' : `/en${path}`;
                window.history.pushState({}, '', newPath);
            } else if (langCode === 'es' && isEnglishPath) {
                const newPath = path.replace(/^\/en\/?/, '/').replace('/rules', '/reglas') || '/';
                window.history.pushState({}, '', newPath);
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition-all duration-200"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-base">{currentLang.flag}</span>
                <span className="text-sm font-medium text-neutral-200">{currentLang.shortCode}</span>
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
                <div className="absolute top-full right-0 mt-2 py-2 min-w-[140px] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl z-50 animate-fadeIn">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleChange(lang.code)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${i18n.language === lang.code ? 'text-orange-400' : 'text-neutral-300'
                                }`}
                            role="option"
                            aria-selected={i18n.language === lang.code}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span className="text-sm font-medium flex-1">{lang.name}</span>
                            {i18n.language === lang.code && (
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
