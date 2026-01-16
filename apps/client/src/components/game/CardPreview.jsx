import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Eye } from 'lucide-react';
import { GameCard } from './GameCard';

/**
 * CardPreview - A minimizable card that expands with a 3D flip animation
 * 
 * Displays as a small card initially. When clicked, it expands to center screen
 * showing the full GameCard content.
 */
export function CardPreview({ state, className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation('game');

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Small Preview Card */}
            <motion.div
                layoutId="card-container"
                onClick={toggleOpen}
                className={`
                    message-bubble cursor-pointer
                    relative w-12 h-16 md:w-14 md:h-20
                    bg-gradient-to-br from-neutral-800 to-neutral-900
                    border border-neutral-700 rounded-lg shadow-lg
                    flex items-center justify-center
                    overflow-hidden group
                    transition-transform hover:scale-105 active:scale-95
                    ${className}
                `}
                whileHover={{ y: -2 }}
            >
                {/* Back pattern decoration */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-600 via-neutral-900 to-neutral-950" />

                {/* Icon */}
                <Eye className="w-5 h-5 text-neutral-400 group-hover:text-orange-400 transition-colors relative z-10" />

                {/* Label (sr-only generally, but visible on hover maybe?) */}
                <span className="sr-only">{t('preview.showCard', 'Show role')}</span>
            </motion.div>

            {/* Expanded Card Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                            onClick={toggleOpen}
                        >
                            <motion.div
                                layoutId="card-container"
                                className="relative w-full max-w-sm aspect-[3/4] max-h-[80vh]"
                                onClick={(e) => e.stopPropagation()} // Prevent close when clicking card itself
                                initial={{ rotateY: 180, scale: 0.5 }}
                                animate={{ rotateY: 0, scale: 1 }}
                                exit={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                style={{ perspective: 1000 }}
                            >
                                {/* Close button */}
                                <button
                                    onClick={toggleOpen}
                                    className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                {/* The Actual Game Card */}
                                <div className="w-full h-full">
                                    <GameCard
                                        state={state}
                                        showRestOfUI={true}
                                        showCardEntrance={false}
                                        initialAnimationPending={false}
                                        expanded={true}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    );
}

// Simple Portal component
function Portal({ children }) {
    if (typeof window === 'undefined') return null;
    return createPortal(children, document.body);
}
