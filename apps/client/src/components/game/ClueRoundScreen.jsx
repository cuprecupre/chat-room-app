import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatBubble } from '../ui/ChatBubble';
import { Avatar } from '../ui/Avatar';
import { GameCard } from './GameCard';
import { HelpLink } from './HelpLink';
import { GameHeader } from './GameHeader';
import { ClueInput } from './ClueInput';

/**
 * ClueRoundScreen - Unified screen for Chat Mode (clue submission + voting)
 * Uses same styles as PlayerList for consistency
 */
export function ClueRoundScreen({
    state,
    user,
    onSubmitClue,
    onVote,
    onOpenInstructions,
}) {
    const { t } = useTranslation('game');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90);

    // Determine which phase we're in
    const isVotingPhase = state.phase === 'playing';
    const isCluePhase = state.phase === 'clue_round';

    const chatMode = state.chatMode || {};
    const currentTurnPlayerId = chatMode.currentTurnPlayerId;
    const revealedClues = chatMode.revealedClues || {};
    const submittedPlayerIds = chatMode.submittedPlayerIds || [];
    const revealedPlayerIds = chatMode.revealedPlayerIds || [];
    const turnStartedAt = chatMode.turnStartedAt;
    const timeoutMs = chatMode.timeoutMs || 90000;

    const isMyTurn = currentTurnPlayerId === user.uid;
    const hasAlreadySubmitted = chatMode.hasSubmitted || hasSubmitted;

    // Voting state
    const hasVoted = state.hasVoted || false;
    const myVote = state.myVote || null;
    const votedPlayers = state.votedPlayers || [];
    const activePlayers = state.activePlayers || [];
    const canVote = state.canVote !== false;

    // Get current turn player info
    const currentTurnPlayer = state.players?.find(p => p.uid === currentTurnPlayerId);
    const currentTurnPlayerName = currentTurnPlayer?.name || 'Jugador';

    // Can change vote if not all have voted
    const allVoted = votedPlayers.length === activePlayers.length;
    const canChangeVote = hasVoted && !allVoted;

    // Timer effect (only for clue phase)
    useEffect(() => {
        if (!isCluePhase || !turnStartedAt) return;

        const updateTimer = () => {
            if (!turnStartedAt) return;
            const elapsed = Date.now() - turnStartedAt;
            const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
            setTimeLeft(isNaN(remaining) ? 90 : remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [turnStartedAt, timeoutMs, isCluePhase]);

    // Reset submission state when turn changes
    useEffect(() => {
        if (!submittedPlayerIds.includes(user.uid)) {
            setHasSubmitted(false);
        }
    }, [currentTurnPlayerId, submittedPlayerIds, user.uid]);

    const handleClueSubmit = (text) => {
        setHasSubmitted(true);
        onSubmitClue(text);
    };

    const handleVote = (targetId) => {
        if (!canVote || targetId === user.uid) return;
        // If already voted for this player and can change, remove vote
        if (myVote === targetId && canChangeVote) {
            onVote(null);
        } else {
            onVote(targetId);
        }
    };

    // Players list sorted by turn order
    const sortedPlayers = (activePlayers.length > 0 ? activePlayers : state.players?.map(p => p.uid) || [])
        .map(uid => state.players?.find(p => p.uid === uid))
        .filter(Boolean);

    return (
        <div className="w-full">
            {/* Game Header (Stepper + Title) */}
            <div className="pb-6 sm:pb-8 space-y-6">
                <GameHeader state={state} />
            </div>

            {/* Main content container */}
            <div className="w-full max-w-md mx-auto px-4 py-2 space-y-4">

                {/* Game Card - Same as Voice Mode */}
                <div className="w-full max-w-xs mx-auto">
                    <GameCard
                        state={state}
                        showRestOfUI={true}
                        showCardEntrance={false}
                        initialAnimationPending={false}
                    />
                </div>

                {/* Players List - Using same styles as PlayerList.jsx */}
                <ul className="space-y-2">
                    {sortedPlayers.map((player) => {
                        const isCurrentTurn = player.uid === currentTurnPlayerId;
                        const isRevealed = revealedPlayerIds.includes(player.uid);
                        const clue = revealedClues[player.uid];
                        const hasPlayerSubmitted = submittedPlayerIds.includes(player.uid);
                        const isMe = player.uid === user.uid;
                        const hasPlayerVoted = votedPlayers.includes(player.uid);
                        const iVotedForThisPlayer = myVote === player.uid;
                        const showVoteButton = isVotingPhase && canVote && !isMe && activePlayers.includes(player.uid);

                        return (
                            <li
                                key={player.uid}
                                className={`flex flex-col bg-white/5 p-4 rounded-md transition-colors ${isCluePhase && isCurrentTurn ? 'bg-blue-500/10' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar photoURL={player.photoURL} displayName={player.name} size="sm" />
                                            {/* Status indicator */}
                                            {isCluePhase && (isRevealed || hasPlayerSubmitted) && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-950 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            {isVotingPhase && hasPlayerVoted && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-950 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium">
                                            {player.name}
                                            {isMe ? ` (${t('playing.you', 'You')})` : ''}
                                        </span>
                                    </div>

                                    {/* Right side: status or vote button */}
                                    <div className="flex items-center gap-3">
                                        {isCluePhase && (
                                            isRevealed ? null : isCurrentTurn ? (
                                                <ChatBubble isTyping={true} position="right" />
                                            ) : hasPlayerSubmitted ? (
                                                <span className="text-xs text-blue-400/60 italic">{t('clueRound.ready', 'Ready')}</span>
                                            ) : (
                                                <span className="text-xs text-neutral-600 italic">{t('clueRound.waiting', 'Waiting...')}</span>
                                            )
                                        )}

                                        {isVotingPhase && showVoteButton && (myVote === null || iVotedForThisPlayer) && (
                                            <Button
                                                onClick={() => handleVote(player.uid)}
                                                variant="outline"
                                                size="sm"
                                                disabled={iVotedForThisPlayer && !canChangeVote}
                                                className={`!w-auto gap-2 px-4 ${iVotedForThisPlayer
                                                    ? canChangeVote
                                                        ? '!border-green-500 !text-green-400 !bg-green-500/10 hover:!bg-green-500/20'
                                                        : '!border-green-500 !text-green-400 !bg-green-500/10 cursor-not-allowed'
                                                    : ''
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                                                </svg>
                                                <span>{iVotedForThisPlayer ? t('playing.voted', 'Voted') : t('playing.vote', 'Vote')}</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Clue bubble - shown below name, always visible when available */}
                                {clue && (isRevealed || isVotingPhase) && (
                                    <div className="mt-3 pl-11 w-full">
                                        <ChatBubble
                                            text={clue}
                                            isRevealed={true}
                                            position="left"
                                            playerName={player.name}
                                        />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {/* Help link like in PlayerList */}
                {isVotingPhase && <HelpLink onOpenInstructions={onOpenInstructions} />}

                {/* Bottom Input Area - Only in clue phase */}
                {isCluePhase && (
                    <ClueInput
                        onSend={handleClueSubmit}
                        isSubmitted={hasAlreadySubmitted}
                        isMyTurn={isMyTurn}
                    />
                )}

                {/* Bottom padding */}
                <div className="h-32" />
            </div>
        </div>
    );
}
