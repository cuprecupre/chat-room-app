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
        <>
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
                            placeholder={t('clueRound.placeholder', 'Escribe tu pista...')}
                            maxLength={maxClueLength}
                            className="w-full px-5 py-3.5 pr-14 bg-neutral-300 border border-neutral-400 rounded-2xl text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xl"
                            autoComplete="off"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!clueText.trim()}
                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${clueText.trim() ? 'bg-orange-600 text-white hover:bg-orange-500 shadow-md active:scale-95' : 'bg-neutral-400 text-neutral-200'}`}
                        >
                            <Send className="w-4.5 h-4.5" />
                        </button>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 px-1 mt-2 pb-0">
                        <span>{isMyTurn ? t('clueRound.yourTurn', "It's your turn!") : t('clueRound.canPreSubmit', 'You can submit before your turn')}</span>
                        <span>{clueText.length}/{maxClueLength}</span>
                    </div>
                </>
            )}
        </>
    );
}
