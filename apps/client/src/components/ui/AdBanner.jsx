import React, { useEffect, useRef, useState } from 'react';

// Fixed height for rectangle ad (used in GameOver)
const AD_WIDTH = 300;
const AD_HEIGHT = 250;

/**
 * AdBanner Component
 * 
 * Displays a Google AdSense ad unit with fixed dimensions.
 * - Consent is now handled by Google CMP / Global settings in index.html
 * - Only loads in production
 * 
 * Props:
 * - slot: Ad unit slot ID from AdSense (required for production, default: 4497969935)
 * - className: Additional CSS classes
 * - width: Fixed width in pixels (default: 300)
 * - height: Fixed height in pixels (default: 250)
 */
export function AdBanner({
    slot,
    className = '',
    width = AD_WIDTH,
    height = AD_HEIGHT
}) {
    const adRef = useRef(null);
    const [adPushed, setAdPushed] = useState(false);

    const isProduction = typeof window !== 'undefined' &&
        (window.location.hostname === 'impostor.me' || window.location.hostname === 'www.impostor.me');

    useEffect(() => {
        // Push ad in production
        if (isProduction && adRef.current && window.adsbygoogle && !adPushed) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdPushed(true);
            } catch (e) {
                console.error('AdSense error:', e);
            }
        }
    }, [isProduction, adPushed]);

    // In development, show simple placeholder with fixed dimensions
    if (!isProduction) {
        return (
            <div className={`flex justify-center ${className}`}>
                <div
                    className="bg-neutral-800 flex items-center justify-center"
                    style={{ width: `${width}px`, height: `${height}px`, border: '1px solid #404040' }}
                >
                    <div className="text-center">
                        <p className="text-neutral-500 text-xs">
                            {width}x{height} Ads
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Production = real ad with fixed dimensions
    return (
        <div className={`flex justify-center ${className}`}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{
                    display: 'inline-block',
                    width: `${width}px`,
                    height: `${height}px`
                }}
                data-ad-client="ca-pub-6211741187285412"
                data-ad-slot={slot}
            />
        </div>
    );
}
