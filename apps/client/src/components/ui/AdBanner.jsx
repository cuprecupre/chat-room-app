import React, { useEffect, useRef, useState } from 'react';
import { hasConsent } from '../CookieConsent';

// Fixed height for rectangle ad (used in GameOver)
const AD_HEIGHT = 100; // 300x100 or similar

/**
 * AdBanner Component
 * 
 * Displays a Google AdSense ad unit with fixed height.
 * - Shows personalized ads if consent given
 * - Shows non-personalized ads if consent denied (GDPR compliant)
 * - Only loads in production
 * 
 * Props:
 * - slot: Ad unit slot ID from AdSense (required for production, default: 4497969935)
 * - format: 'auto', 'horizontal', 'rectangle', 'vertical' (default: 'auto')
 * - className: Additional CSS classes
 * - height: Fixed height in pixels (default: 100)
 */
export function AdBanner({
    slot,
    format = 'auto',
    className = '',
    height = AD_HEIGHT
}) {
    const adRef = useRef(null);
    const [adPushed, setAdPushed] = useState(false);

    const isProduction = typeof window !== 'undefined' &&
        (window.location.hostname === 'impostor.me' || window.location.hostname === 'www.impostor.me');

    // Check if user has consented to personalized ads
    const hasPersonalizedConsent = hasConsent('advertising');

    useEffect(() => {
        // Push ad in production (personalized or not based on consent)
        if (isProduction && adRef.current && window.adsbygoogle && !adPushed) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdPushed(true);
            } catch (e) {
                console.error('AdSense error:', e);
            }
        }
    }, [isProduction, adPushed]);

    // In development, show realistic placeholder with fixed height
    if (!isProduction) {
        return (
            <div className={`${className}`}>
                <div
                    className="relative bg-gradient-to-r from-neutral-800 to-neutral-700 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ height: `${height}px`, minHeight: `${height}px`, maxHeight: `${height}px` }}
                >
                    <div className="text-center px-4">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            <span className="text-neutral-400 text-sm font-medium">Anuncio de Google</span>
                        </div>
                        <p className="text-neutral-500 text-xs">
                            {height}px {hasPersonalizedConsent ? '(personalizado)' : '(no personalizado)'} • Preview
                        </p>
                    </div>

                    {/* Corner badge */}
                    <div className="absolute top-2 right-2 bg-neutral-600/80 px-2 py-0.5 rounded text-[10px] text-neutral-300">
                        Ad
                    </div>

                    {/* Simulated ad border */}
                    <div className="absolute inset-0 border border-neutral-600/50 rounded-xl pointer-events-none"></div>
                </div>
            </div>
        );
    }

    // Production = real ad with fixed height container
    // data-npa="1" = non-personalized ads (when no consent)
    return (
        <div className={`ad-container ${className}`}>
            <div
                className="rounded-xl overflow-hidden bg-neutral-800/50"
                style={{ height: `${height}px`, minHeight: `${height}px`, maxHeight: `${height}px` }}
            >
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{
                        display: 'block',
                        width: '100%',
                        height: `${height}px`
                    }}
                    data-ad-client="ca-pub-6211741187285412"
                    data-ad-slot={slot}
                    data-ad-format={format}
                    data-full-width-responsive="true"
                    {...(!hasPersonalizedConsent && { 'data-npa': '1' })}
                />
            </div>
        </div>
    );
}
