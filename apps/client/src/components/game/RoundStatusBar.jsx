import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * RoundStatusBar - Compact horizontal bar showing round info and current status
 */
export function RoundStatusBar({
    currentRound,
    phase,
    currentTurnPlayerName,
    isMyTurn,
    timeLeft,
    votedCount,
    totalPlayers,
}) {
    const { t } = useTranslation('game');

    const isVotingPhase = phase === 'playing';
    const isCluePhase = phase === 'clue_round';

    return (
        <div className="px-1 py-1 flex items-center justify-between">
            {/* Left: Phase & Round */}
            <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-blue-400 font-bold" />
                <span className="text-xl uppercase tracking-wider font-bold text-blue-400">
                    {isVotingPhase ? t('voting.title', 'Vote') : t('clueRound.title', 'Clue')}
                </span>
                <span className="text-neutral-500 font-bold">·</span>
                <span className="text-xl font-serif text-neutral-100 font-bold">
                    R{currentRound}
                </span>
            </div>

            {/* Right: Turn info or voting status */}
            <div className="flex items-center gap-3">
                {isCluePhase ? (
                    <>
                        <span className="text-base text-neutral-400">
                            {isMyTurn ? t('clueRound.yourTurnShort', 'Your turn') : currentTurnPlayerName}
                        </span>
                        <span className={`text-xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-neutral-300'}`}>
                            {timeLeft}s
                        </span>
                    </>
                ) : (
                    <span className="text-lg text-neutral-400 font-medium">
                        {votedCount}/{totalPlayers} {t('voting.voted', 'voted')}
                    </span>
                )}
            </div>
        </div>
    );
}
