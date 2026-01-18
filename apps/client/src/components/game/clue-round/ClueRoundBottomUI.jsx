import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ClueInput } from '../ClueInput';

/**
 * ClueRoundBottomUI - Handles the fixed bottom area for Chat Mode.
 * Manages transitions between ClueInput and WaitMessage.
 */
export function ClueRoundBottomUI({
    isCluePhase,
    showRestOfUI,
    hasAlreadySubmitted,
    isMyTurn,
    onClueSubmit,
    t
}) {
    const isVisible = isCluePhase && showRestOfUI && !hasAlreadySubmitted;

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    key={isMyTurn ? "clue-input" : "wait-message"}
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    exit={{ y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-black pt-2 pb-4 px-4 !m-0"
                >
                    {/* Gradient transition ABOVE the solid base */}
                    <div className="absolute top-0 left-0 right-0 h-16 -translate-y-full bg-gradient-to-t from-black to-transparent pointer-events-none" />

                    <div className="max-w-md mx-auto">
                        {isMyTurn ? (
                            <ClueInput
                                onSend={onClueSubmit}
                                isSubmitted={hasAlreadySubmitted}
                                isMyTurn={isMyTurn}
                            />
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-neutral-400">
                                    {t('clueRound.waitForTurn', 'Espera tu turno para escribir tu pista')}
                                </p>
                                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                                    {t('clueRound.thinkTime', 'Piénsala bien. Tendrás 90 segundos')}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
