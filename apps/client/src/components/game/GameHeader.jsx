import React from 'react';
import { useTranslation } from 'react-i18next';
import { GameStepper } from '../ui/GameStepper';

/**
 * GameHeader - Common header for game screens showing progress (stepper) 
 * and the current phase title.
 */
export function GameHeader({ state, showAnimation = true }) {
    const { t } = useTranslation('game');
    const isChatMode = state.gameMode === 'chat';
    const isVotingPhase = state.phase === 'playing';

    // Determine title based on phase and mode
    let title = '';
    if (isChatMode) {
        title = isVotingPhase ? t('voting.title', '¡A votar!') : t('clueRound.title', 'Ronda de Pistas');
    } else {
        // Voice mode title (standard)
        title = state.phase === 'round_result'
            ? t('roundResult.title', 'Resultados')
            : t('board.clueAndVoteRound', 'Ronda de pistas y votos');
    }

    return (
        <div className="w-full space-y-6">
            {/* Round Stepper */}
            <GameStepper
                roundCount={state.currentRound || 1}
                currentTurn={state.currentRound}
                showAnimation={showAnimation}
            />

            {/* Phase Title */}
            <div className="w-full text-center">
                <h2 className="text-3xl md:text-4xl font-serif text-neutral-50 animate-fadeIn">
                    {title}
                </h2>
            </div>
        </div>
    );
}
