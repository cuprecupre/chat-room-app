import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatBubble } from '../ui/ChatBubble';
import { Avatar } from '../ui/Avatar';
import { GameCard } from './GameCard';
import { HelpLink } from './HelpLink';
import { GameHeader } from './GameHeader';
import { ClueInput } from './ClueInput';
import { Button } from '../ui/Button';
import { KickPlayerModal } from '../KickPlayerModal';
import { DropdownMenu, DropdownItem } from '../ui/DropdownMenu';

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
    showRestOfUI = true,
    initialAnimationPending = false,
    showCardEntrance = false,
    onKickPlayer,
    isHost,
}) {
    const { t } = useTranslation('game');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [kickTarget, setKickTarget] = useState(null);

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

    // Timer state
    const [timeLeft, setTimeLeft] = useState(timeoutMs / 1000);

    // Update timer
    useEffect(() => {
        if (!isCluePhase || !turnStartedAt) return;

        const updateTimer = () => {
            const now = Date.now();
            const elapsed = now - turnStartedAt;
            const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
            setTimeLeft(remaining);
        };

        // Initial update
        updateTimer();

        // Interval
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [turnStartedAt, timeoutMs, isCluePhase]);

    const TurnTimer = () => (
        <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-bold tabular-nums">
                {timeLeft}s
            </span>
        </div>
    );



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
            <div className={`pb-6 sm:pb-8 space-y-6 ${showRestOfUI ? "" : "opacity-0 pointer-events-none"}`}>
                <GameHeader state={state} showAnimation={showRestOfUI} />
            </div>

            {/* Main content container */}
            <div className="w-full max-w-md mx-auto px-2 py-2 space-y-4">

                {/* Game Card - Always visible */}
                <div className="w-full max-w-xs mx-auto mb-6">
                    <GameCard
                        state={state}
                        showRestOfUI={showRestOfUI}
                        showCardEntrance={showCardEntrance}
                        initialAnimationPending={initialAnimationPending}
                    />
                </div>

                {/* Players List - Moves up when card disappears */}
                <motion.ul
                    layout
                    className={`space-y-2 ${showRestOfUI ? "animate-fadeIn animate-delay-800" : "opacity-0 pointer-events-none"}`}
                >
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
                                        {/* Timer only for current turn player and not submitted */}
                                        {isCluePhase && isCurrentTurn && !hasPlayerSubmitted && (
                                            <TurnTimer />
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

                                        {/* Kick action for host - using Dropdown */}
                                        {isHost && !isMe && onKickPlayer && (
                                            <DropdownMenu
                                                trigger={
                                                    <button className="p-2 -mr-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                }
                                            >
                                                <DropdownItem
                                                    danger
                                                    onClick={() => setKickTarget(player)}
                                                >
                                                    {t('common.kick', 'Eliminar jugador')}
                                                </DropdownItem>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>

                                {/* Clue/Typing area - always in the same place below the name */}
                                {
                                    // Show bubble if: 1. Player has a revealed clue OR 2. It's the clue phase, it's this player's turn, and they haven't submitted
                                    (clue || (isCluePhase && isCurrentTurn && !hasPlayerSubmitted)) && (
                                        <div className="mt-3 pl-11 w-full">
                                            <ChatBubble
                                                text={clue}
                                                isRevealed={!!clue}
                                                isTyping={!clue && isCurrentTurn && !hasPlayerSubmitted}
                                                position="left"
                                                playerName={player.name}
                                            />
                                        </div>
                                    )
                                }
                            </li>
                        );
                    })}
                </motion.ul>

                {/* Help link like in PlayerList */}
                {isVotingPhase && showRestOfUI && <HelpLink onOpenInstructions={onOpenInstructions} isChatMode={true} />}

                {/* Bottom Input Area - Only in clue phase */}
                <AnimatePresence mode="wait">
                    {isCluePhase && showRestOfUI && !hasAlreadySubmitted && (
                        isMyTurn ? (
                            <motion.div
                                key="clue-input"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20 }}
                            >
                                <div className="w-full bg-gradient-to-t from-black from-80% to-transparent pt-16 pb-8 px-4">
                                    <div className="max-w-md mx-auto space-y-2">
                                        <ClueInput
                                            onSend={handleClueSubmit}
                                            isSubmitted={hasAlreadySubmitted}
                                            isMyTurn={isMyTurn}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="wait-message"
                                className="fixed bottom-0 left-0 right-0 !m-0 !p-0 z-20"
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%" }}
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <div className="w-full bg-gradient-to-t from-black from-80% to-transparent pt-16 pb-8 px-4">
                                    <div className="max-w-md mx-auto space-y-2 text-center">
                                        <p className="text-neutral-400">{t('clueRound.waitForTurn', 'Espera tu turno para escribir tu pista')}</p>
                                        <p className="text-xs text-neutral-500 uppercase tracking-wide">{t('clueRound.thinkTime', 'Piénsala bien. Tendrás 90 segundos')}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>

                {/* Bottom padding */}
                <div className="h-32" />

                {/* Kick confirmation modal */}
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
        </div>
    );
}
