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
                    <div className="flex justify-between items-center mb-1 px-1">
                        <span className={`text-[10px] uppercase tracking-[0.1em] font-semibold ${isMyTurn ? 'text-orange-500' : 'text-neutral-500'}`}>
                            {isMyTurn ? t('clueRound.yourTurn', "¡Es tu turno!") : t('clueRound.canPreSubmit', 'Puedes escribir antes')}
                        </span>
                        <span className="text-[10px] tabular-nums text-neutral-500 opacity-50">
                            {clueText.length}/{maxClueLength}
                        </span>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={clueText}
                            onChange={(e) => setClueText(e.target.value.slice(0, maxClueLength))}
                            onKeyDown={handleKeyDown}
                            placeholder={t('clueRound.placeholder', 'Escribe tu pista...')}
                            maxLength={maxClueLength}
                            className="w-full px-4 py-3 pr-12 bg-neutral-200 border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                            autoComplete="off"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!clueText.trim()}
                            className={`absolute right-1 top-1 bottom-1 px-3 rounded-lg transition-all bg-orange-600 text-white ${clueText.trim() ? 'active:scale-95' : 'opacity-40 cursor-not-allowed'}`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
