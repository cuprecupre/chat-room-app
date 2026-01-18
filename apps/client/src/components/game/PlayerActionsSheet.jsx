import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export function PlayerActionsSheet({ isOpen, onClose, onKick, playerName }) {
    const { t } = useTranslation('game');

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-neutral-900 border-t border-white/10 z-[80] rounded-t-3xl flex flex-col shadow-2xl safe-bottom"
                    >
                        {/* Handle bar for dragging visual */}
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    {t('modals.kickPlayer.actions', 'Acciones')}
                                </span>
                                <h3 className="text-xl font-serif text-neutral-50">{playerName}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <Button
                                onClick={() => {
                                    onKick();
                                    onClose();
                                }}
                                variant="danger"
                                className="w-full justify-start gap-3 h-14 text-lg"
                            >
                                <UserMinus className="w-6 h-6" />
                                <span>{t('modals.kickPlayer.kickTitle', { name: playerName }) || `Eliminar a ${playerName}`}</span>
                            </Button>

                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="w-full h-12 text-neutral-400 hover:text-white"
                            >
                                {t('common:buttons.cancel', 'Cancelar')}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
