import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GameCard } from './GameCard';
import { HelpLink } from './HelpLink';
import { GameHeader } from './GameHeader';
import { KickPlayerModal } from '../KickPlayerModal';
import { ClueRoundPlayerItem } from './clue-round/ClueRoundPlayerItem';
import { ClueRoundBottomUI } from './clue-round/ClueRoundBottomUI';
import { ClueRoundTimer } from './clue-round/ClueRoundTimer';

/**
 * ClueRoundScreen - Unified screen for Chat Mode (clue submission + voting)
 */
export function ClueRoundScreen({
    state,
    user,
    onSubmitClue,
    onVote,
    onOpenInstructions,
    showRestOfUI = true,
    initialAnimationPending = false,
    showCardEntrance = false,
    onKickPlayer,
    isHost,
}) {
    const { t } = useTranslation('game');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [kickTarget, setKickTarget] = useState(null);

    // Phase identification
    const isVotingPhase = state.phase === 'playing';
    const isCluePhase = state.phase === 'clue_round';

    const chatMode = state.chatMode || {};
    const {
        currentTurnPlayerId,
        revealedClues = {},
        submittedPlayerIds = [],
        turnStartedAt,
        timeoutMs = 90000
    } = chatMode;

    const isMyTurn = currentTurnPlayerId === user.uid;
    const hasAlreadySubmitted = chatMode.hasSubmitted || hasSubmitted;

    // Voting state
    const {
        hasVoted = false,
        myVote = null,
        votedPlayers = [],
        activePlayers = [],
        canVote = true
    } = state;

    // Can change vote if not all have voted
    const allVoted = votedPlayers.length === activePlayers.length;
    const canChangeVote = hasVoted && !allVoted;

    // Timer logic
    const [timeLeft, setTimeLeft] = useState(Math.ceil(timeoutMs / 1000));

    useEffect(() => {
        if (!isCluePhase || !turnStartedAt) return;

        const updateTimer = () => {
            const elapsed = Date.now() - turnStartedAt;
            setTimeLeft(Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000)));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [turnStartedAt, timeoutMs, isCluePhase]);

    // Reset local submission state on turn change
    useEffect(() => {
        if (!submittedPlayerIds.includes(user.uid)) {
            setHasSubmitted(false);
        }
    }, [currentTurnPlayerId, submittedPlayerIds, user.uid]);

    // Sorted players by turn order
    const sortedPlayers = useMemo(() => {
        const uids = activePlayers.length > 0 ? activePlayers : state.players?.map(p => p.uid) || [];
        return uids.map(uid => state.players?.find(p => p.uid === uid)).filter(Boolean);
    }, [activePlayers, state.players]);

    const handleClueSubmit = (text) => {
        setHasSubmitted(true);
        onSubmitClue(text);
    };

    const handleVote = (targetId) => {
        if (!canVote || targetId === user.uid) return;
        // Toggle vote if allowed
        if (myVote === targetId && canChangeVote) {
            onVote(null);
        } else {
            onVote(targetId);
        }
    };

    return (
        <div className="w-full">
            {/* Header: Stepper + Progress */}
            <div className={`pb-6 sm:pb-8 space-y-6 ${showRestOfUI ? "" : "opacity-0 pointer-events-none"}`}>
                <GameHeader state={state} showAnimation={showRestOfUI} />
            </div>

            <div className="w-full max-w-md mx-auto px-2 py-2 space-y-4">
                {/* Secret Card */}
                <div className="w-full max-w-xs mx-auto mb-6">
                    <GameCard
                        state={state}
                        showRestOfUI={showRestOfUI}
                        showCardEntrance={showCardEntrance}
                        initialAnimationPending={initialAnimationPending}
                    />
                </div>

                {/* Player Interaction List */}
                <motion.ul
                    layout
                    className={`space-y-2 ${showRestOfUI ? "animate-fadeIn animate-delay-800" : "opacity-0 pointer-events-none"}`}
                >
                    {sortedPlayers.map((player) => (
                        <ClueRoundPlayerItem
                            key={player.uid}
                            player={player}
                            isCurrentTurn={player.uid === currentTurnPlayerId}
                            isCluePhase={isCluePhase}
                            isVotingPhase={isVotingPhase}
                            hasPlayerSubmitted={submittedPlayerIds.includes(player.uid)}
                            clue={revealedClues[player.uid]}
                            isMe={player.uid === user.uid}
                            hasThisPlayerVoted={votedPlayers.includes(player.uid)}
                            iVotedForThisPlayer={myVote === player.uid}
                            hasMeAlreadyVoted={hasVoted}
                            canVote={canVote}
                            canChangeVote={canChangeVote}
                            isActive={activePlayers.includes(player.uid)}
                            isHost={isHost}
                            onVote={handleVote}
                            onKick={setKickTarget}
                            TimerComponent={() => <ClueRoundTimer timeLeft={timeLeft} />}
                        />
                    ))}
                </motion.ul>

                {/* Help/Instructions */}
                {isVotingPhase && showRestOfUI && (
                    <HelpLink onOpenInstructions={onOpenInstructions} isChatMode={true} />
                )}

                {/* Spacing for fixed bottom */}
                <div className="h-32" />

                {/* Kick Modal */}
                <KickPlayerModal
                    isOpen={!!kickTarget}
                    onClose={() => setKickTarget(null)}
                    onConfirm={() => {
                        if (kickTarget) {
                            onKickPlayer(kickTarget.uid);
                            setKickTarget(null);
                        }
                    }}
                    playerName={kickTarget?.name || ""}
                />
            </div>

            {/* Fixed Bottom UI (Inputs / Waiting) - Moved outside to avoid layout constraints */}
            <ClueRoundBottomUI
                isCluePhase={isCluePhase}
                showRestOfUI={showRestOfUI}
                hasAlreadySubmitted={hasAlreadySubmitted}
                isMyTurn={isMyTurn}
                onClueSubmit={handleClueSubmit}
                t={t}
            />
        </div>
    );
}
