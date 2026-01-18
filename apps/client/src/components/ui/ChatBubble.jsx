import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * ChatBubble - Animated chat bubble component for displaying clues
 * 
 * @param {string} text - The clue text to display
 * @param {boolean} isRevealed - Whether the clue has been revealed
 * @param {boolean} isTyping - Show typing indicator (...)
 * @param {boolean} isWaiting - Show waiting state (empty bubble)
 * @param {string} position - Bubble tail position: 'left' | 'right'
 * @param {string} playerName - Name of the player (for accessibility)
 */
export function ChatBubble({
    text,
    isRevealed = false,
    isTyping = false,
    position = 'left',
    playerName = ''
}) {
    const { t } = useTranslation('game');
    const bubbleVariants = {
        hidden: {
            scale: 0.8,
            opacity: 0,
            y: 10
        },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        },
        exit: {
            scale: 0.8,
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    const typingDotVariants = {
        animate: {
            y: [0, -4, 0],
            transition: {
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Determine bubble content
    const renderContent = () => {
        if (isTyping) {
            return (
                <div className="flex items-center gap-1 px-4 py-3">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="w-1.5 h-1.5 bg-white rounded-full"
                            animate={{
                                y: [0, -5, 0],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: "easeInOut",
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (isRevealed && text) {
            return (
                <div className="px-4 py-2 text-orange-400 text-sm font-medium leading-relaxed">
                    {text}
                </div>
            );
        }

        return null;
    };

    const content = renderContent();
    if (!content) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={isTyping ? 'typing' : 'revealed'}
                variants={bubbleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative inline-block"
                aria-label={playerName ? `Pista de ${playerName}: ${text || 'esperando'}` : undefined}
            >
                {/* Background Layer: Body + Seamless Tail */}
                <div className={`absolute inset-0 z-0 ${isTyping ? 'opacity-100' : 'opacity-10'}`}>
                    {/* Main Body */}
                    <div className={`absolute inset-0 bg-orange-600 rounded-2xl ${position === 'left' ? 'rounded-tl-none' : 'rounded-tr-none'}`} />

                    {/* Tail connected to body */}
                    <div
                        className={`
                            absolute top-0 w-3 h-3 bg-orange-600
                            ${position === 'left'
                                ? '-left-[11px]'
                                : '-right-[11px]'
                            }
                        `}
                        style={{
                            clipPath: position === 'left'
                                ? 'polygon(100% 0, 0 0, 100% 80%)'
                                : 'polygon(0 0, 100% 0, 0 80%)'
                        }}
                    />
                </div>

                {/* Content Layer (on top) */}
                <div className="relative z-10">
                    {content}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * TypingIndicator - Animated dots for typing state
 */
export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
                    animate={{
                        y: [0, -3, 0],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15
                    }}
                />
            ))}
        </div>
    );
}
