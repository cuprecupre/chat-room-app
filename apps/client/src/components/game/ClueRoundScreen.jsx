import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, Check, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatBubble } from '../ui/ChatBubble';
import { Button } from '../ui/Button';
import { CardPreview } from './CardPreview';
import { HelpCircle } from 'lucide-react';

const MAX_CLUE_LENGTH = 30;

/**
 * ClueRoundScreen - Main screen for the clue submission phase in Chat Mode
 */
export function ClueRoundScreen({
    state,
    user,
    onSubmitClue,
    onOpenInstructions,
}) {
    const { t } = useTranslation('game');
    const [clueText, setClueText] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90);

    const chatMode = state.chatMode || {};
    const currentTurnPlayerId = chatMode.currentTurnPlayerId;
    const revealedClues = chatMode.revealedClues || {};
    const submittedPlayerIds = chatMode.submittedPlayerIds || [];
    const revealedPlayerIds = chatMode.revealedPlayerIds || [];
    const turnStartedAt = chatMode.turnStartedAt;
    const timeoutMs = chatMode.timeoutMs || 90000;

    const isMyTurn = currentTurnPlayerId === user.uid;
    const hasAlreadySubmitted = chatMode.hasSubmitted || hasSubmitted;

    // Get current turn player info
    const currentTurnPlayer = state.players?.find(p => p.uid === currentTurnPlayerId);
    const currentTurnPlayerName = currentTurnPlayer?.name || 'Jugador';

    // Timer effect
    useEffect(() => {
        if (!turnStartedAt) return;

        const updateTimer = () => {
            if (!turnStartedAt) return;
            const elapsed = Date.now() - turnStartedAt;
            const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
            setTimeLeft(isNaN(remaining) ? 90 : remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [turnStartedAt, timeoutMs]);

    // Reset submission state when turn changes
    useEffect(() => {
        if (!submittedPlayerIds.includes(user.uid)) {
            setHasSubmitted(false);
            setClueText('');
        }
    }, [currentTurnPlayerId, submittedPlayerIds, user.uid]);

    const handleSubmit = () => {
        if (!clueText.trim() || hasAlreadySubmitted) return;

        setHasSubmitted(true);
        onSubmitClue(clueText.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Players list sorted by turn order
    const sortedPlayers = (state.activePlayers || [])
        .map(uid => state.players?.find(p => p.uid === uid))
        .filter(Boolean);

    // Fallback if no active players found
    const playersToRender = sortedPlayers.length > 0 ? sortedPlayers : (state.players || []);

    return (
        <div className="w-full max-w-md mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-semibold">
                        {t('clueRound.title', 'Clue Round')}
                    </span>
                </div>
                <h2 className="text-2xl font-serif text-neutral-100">
                    {t('clueRound.round', 'Round')} {state.currentRound}
                </h2>
            </div>

            {/* Current Turn Indicator */}
            <motion.div
                key={currentTurnPlayerId}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center"
            >
                <p className="text-sm text-neutral-400 mb-1">
                    {t('clueRound.turnOf', "It's the turn of")}
                </p>
                <p className="text-xl font-semibold text-neutral-100">
                    {isMyTurn ? t('clueRound.you', 'You!') : currentTurnPlayerName}
                </p>

                {/* Timer */}
                <div className={`flex items-center justify-center gap-2 mt-3 ${timeLeft <= 10 ? 'text-red-400' : 'text-neutral-400'
                    }`}>
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-mono font-bold">{timeLeft}s</span>
                </div>
            </motion.div>

            {/* Tools Bar (Card Preview + Help) */}
            <div className="flex justify-between items-center px-2">
                <CardPreview state={state} />

                <button
                    onClick={onOpenInstructions}
                    className="
                        w-10 h-10 rounded-full
                        bg-neutral-800 border border-neutral-700
                        flex items-center justify-center
                        text-neutral-400 hover:text-white hover:bg-neutral-700
                        transition-colors
                    "
                    aria-label={t('common.help', 'Help')}
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>

            {/* Players & Clues List */}
            <div className="space-y-3">
                {playersToRender.map((player, index) => {
                    const isCurrentTurn = player.uid === currentTurnPlayerId;
                    const isRevealed = revealedPlayerIds.includes(player.uid);
                    const clue = revealedClues[player.uid];
                    const hasPlayerSubmitted = submittedPlayerIds.includes(player.uid);

                    return (
                        <motion.div
                            key={player.uid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                                flex items-center gap-3 p-3 rounded-xl transition-colors
                                ${isCurrentTurn
                                    ? 'bg-blue-500/10 border border-blue-500/30'
                                    : 'bg-neutral-900/30'
                                }
                            `}
                        >
                            {/* Avatar */}
                            <div className="relative">
                                <img
                                    src={player.photoURL || `https://api.dicebear.com/7.x/thumbs/svg?seed=${player.uid}`}
                                    alt={player.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                {isRevealed && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                {!isRevealed && hasPlayerSubmitted && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${player.uid === user.uid ? 'text-orange-400' : 'text-neutral-200'
                                    }`}>
                                    {player.name}
                                    {player.uid === user.uid && ' (Tú)'}
                                </p>
                            </div>

                            {/* Clue Bubble */}
                            <div className="flex-shrink-0">
                                {isRevealed ? (
                                    <ChatBubble
                                        text={clue}
                                        isRevealed={true}
                                        position="right"
                                        playerName={player.name}
                                    />
                                ) : isCurrentTurn ? (
                                    <ChatBubble
                                        isTyping={true}
                                        position="right"
                                    />
                                ) : hasPlayerSubmitted ? (
                                    <span className="text-xs text-blue-400/60 italic">
                                        {t('clueRound.ready', 'Ready')}
                                    </span>
                                ) : (
                                    <span className="text-xs text-neutral-600 italic">
                                        {t('clueRound.waiting', 'Waiting...')}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Input Area (fixed at bottom) */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent pt-8 pb-6 px-4">
                <div className="max-w-md mx-auto space-y-2">
                    {hasAlreadySubmitted ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-green-400">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {t('clueRound.clueSubmitted', 'Clue submitted!')}
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={clueText}
                                    onChange={(e) => setClueText(e.target.value.slice(0, MAX_CLUE_LENGTH))}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t('clueRound.placeholder', 'Write your clue...')}
                                    maxLength={MAX_CLUE_LENGTH}
                                    className="
                                        w-full px-4 py-3 pr-14
                                        bg-neutral-900 border border-neutral-700
                                        rounded-xl text-neutral-100
                                        placeholder:text-neutral-500
                                        focus:outline-none focus:border-blue-500
                                        transition-colors
                                    "
                                    autoComplete="off"
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={!clueText.trim()}
                                    className={`
                                        absolute right-2 top-1/2 -translate-y-1/2
                                        p-2 rounded-lg transition-colors
                                        ${clueText.trim()
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-neutral-800 text-neutral-500'
                                        }
                                    `}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-500 px-1">
                                <span>
                                    {isMyTurn
                                        ? t('clueRound.yourTurn', "It's your turn!")
                                        : t('clueRound.canPreSubmit', 'You can submit before your turn')
                                    }
                                </span>
                                <span>{clueText.length}/{MAX_CLUE_LENGTH}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom padding for fixed input */}
            <div className="h-32" />
        </div>
    );
}
