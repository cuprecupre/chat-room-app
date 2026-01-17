import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { capitalize } from './utils';

// Firebase Storage CDN URLs
const CDN_BASE = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2F";
const CDN_SUFFIX = "?alt=media";
const cardImg = `${CDN_BASE}card.jpg${CDN_SUFFIX}`;
const cardBackImg = `${CDN_BASE}card-back.jpg${CDN_SUFFIX}`;

/**
 * CardPreview - A horizontal mini card that expands with 3D flip
 * Shows as a small horizontal card. When clicked, it flips to reveal the back.
 */
export function CardPreview({ state, className = "" }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { t, i18n } = useTranslation('game');
    const flipTimeoutRef = useRef(null);

    // Auto flip back after 5 seconds
    useEffect(() => {
        if (isFlipped) {
            flipTimeoutRef.current = setTimeout(() => {
                setIsFlipped(false);
                setIsExpanded(false);
            }, 5000);
        }
        return () => {
            if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
        };
    }, [isFlipped]);

    const handleClick = () => {
        if (!isExpanded) {
            // First click: expand and flip
            setIsExpanded(true);
            setTimeout(() => setIsFlipped(true), 100);
        } else if (isFlipped) {
            // Already flipped: flip back and collapse
            setIsFlipped(false);
            setTimeout(() => setIsExpanded(false), 300);
        } else {
            // Expanded but not flipped: flip
            setIsFlipped(true);
        }
    };

    // Get translated content
    const langKey = i18n.language?.split('-')[0] || 'es';
    const translations = state?.secretWordTranslations?.[langKey];
    let displayWord = translations?.word || state?.secretWord;
    if (displayWord === 'SECRET_WORD_HINT') {
        displayWord = t('card.hint');
    }
    const displayCategory = translations?.category || state?.secretCategory;
    const isImpostor = state?.role === 'impostor';

    return (
        <div className={`${className}`}>
            <motion.div
                layout
                onClick={handleClick}
                className={`
                    cursor-pointer relative
                    ${isExpanded
                        ? 'w-48 h-28 md:w-56 md:h-32'
                        : 'w-16 h-10 md:w-20 md:h-12'
                    }
                    transition-all duration-300
                `}
                style={{ perspective: 1000 }}
            >
                <motion.div
                    className="flip-card-inner w-full h-full"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5, type: "spring", damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front - Mini card with eye */}
                    <div
                        className="flip-card-front absolute inset-0 rounded-lg overflow-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className={`
                            w-full h-full 
                            bg-gradient-to-br from-neutral-800 to-neutral-900
                            border border-neutral-700
                            flex items-center justify-center
                            ${isExpanded ? 'gap-3' : 'gap-1'}
                        `}>
                            {/* Card image preview */}
                            <div className={`
                                relative overflow-hidden rounded
                                ${isExpanded ? 'w-16 h-20' : 'w-6 h-8'}
                            `}>
                                <img
                                    src={cardImg}
                                    alt="Card"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {isExpanded && (
                                <div className="flex flex-col items-start text-white">
                                    <span className="text-xs text-neutral-400">{t('card.tapTo', 'Tap to')}</span>
                                    <span className="text-sm font-medium">{t('card.flip', 'flip')}</span>
                                </div>
                            )}
                            {!isExpanded && (
                                <Eye className="w-3 h-3 text-neutral-400" />
                            )}
                        </div>
                    </div>

                    {/* Back - Card info */}
                    <div
                        className="flip-card-back absolute inset-0 rounded-lg overflow-hidden"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <div className="w-full h-full relative">
                            <img
                                src={cardBackImg}
                                alt="Card back"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                                {isImpostor ? (
                                    <>
                                        <span className="text-[10px] text-orange-400 uppercase font-bold">
                                            {t('roles.impostor', 'Impostor')}
                                        </span>
                                        {displayCategory && (
                                            <span className="text-xs font-serif text-white mt-1">
                                                {capitalize(displayCategory)}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[10px] text-neutral-400 uppercase">
                                            {t('card.secretWord', 'Secret word')}
                                        </span>
                                        <span className="text-sm font-serif text-white mt-0.5">
                                            {capitalize(displayWord || '...')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
