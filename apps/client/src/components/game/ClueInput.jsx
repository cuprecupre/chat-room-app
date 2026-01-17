import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_MAX_CLUE_LENGTH = 30;

/**
 * ClueInput - Input field for submitting clues in Chat Mode
 */
export function ClueInput({
    onSend,
    isSubmitted,
    isMyTurn,
    maxClueLength = DEFAULT_MAX_CLUE_LENGTH,
}) {
    const { t } = useTranslation('game');
    const [clueText, setClueText] = useState('');

    const handleSubmit = () => {
        if (!clueText.trim() || isSubmitted) return;
        onSend(clueText.trim());
        setClueText(''); // Clear input after sending
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent pt-8 pb-6 px-4 z-20">
            <div className="max-w-md mx-auto space-y-2">
                {isSubmitted ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-green-400">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('clueRound.clueSubmitted', 'Clue submitted!')}</span>
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            <input
                                type="text"
                                value={clueText}
                                onChange={(e) => setClueText(e.target.value.slice(0, maxClueLength))}
                                onKeyDown={handleKeyDown}
                                placeholder={t('clueRound.placeholder', 'Write your clue...')}
                                maxLength={maxClueLength}
                                className="w-full px-4 py-3 pr-14 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                                autoComplete="off"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!clueText.trim()}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${clueText.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-neutral-800 text-neutral-500'}`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 px-1">
                            <span>{isMyTurn ? t('clueRound.yourTurn', "It's your turn!") : t('clueRound.canPreSubmit', 'You can submit before your turn')}</span>
                            <span>{clueText.length}/{maxClueLength}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
