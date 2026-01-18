import React from 'react';
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../ui/Avatar';
import { ChatBubble } from '../../ui/ChatBubble';
import { Button } from '../../ui/Button';
import { DropdownMenu, DropdownItem } from '../../ui/DropdownMenu';

export function ClueRoundPlayerItem({
    player,
    isCurrentTurn,
    isCluePhase,
    isVotingPhase,
    hasPlayerSubmitted,
    clue,
    isMe,
    hasThisPlayerVoted,
    iVotedForThisPlayer,
    hasMeAlreadyVoted,
    canVote,
    canChangeVote,
    isActive,
    isHost,
    onVote,
    onKick,
    TimerComponent
}) {
    const { t } = useTranslation('game');
    const showVoteButton = isVotingPhase && canVote && !isMe && isActive;

    return (
        <li
            className={`flex flex-col bg-white/5 p-4 rounded-md transition-colors ${isCluePhase && isCurrentTurn ? 'bg-blue-500/10' : ''
                }`}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar photoURL={player.photoURL} displayName={player.name} size="sm" />
                        {/* Status indicator - Shows if this specific player has voted */}
                        {isVotingPhase && hasThisPlayerVoted && (
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

                <div className="flex items-center gap-3">
                    {/* Timer only for current turn player and not submitted */}
                    {isCluePhase && isCurrentTurn && !hasPlayerSubmitted && TimerComponent && (
                        <TimerComponent />
                    )}

                    {/* Vote button - Shown if I haven't voted or if I voted for this player */}
                    {showVoteButton && (!hasMeAlreadyVoted || iVotedForThisPlayer) && (
                        <Button
                            onClick={() => onVote(player.uid)}
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

                    {/* Kick action for host */}
                    {isHost && !isMe && onKick && (
                        <DropdownMenu
                            trigger={
                                <button className="p-2 -mr-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            }
                        >
                            <DropdownItem
                                danger
                                onClick={() => onKick(player)}
                            >
                                {t('common.kick', 'Eliminar jugador')}
                            </DropdownItem>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Clue/Typing area */}
            {(clue || (isCluePhase && isCurrentTurn && !hasPlayerSubmitted)) && (
                <div className="mt-3 pl-11 w-full">
                    <ChatBubble
                        text={clue}
                        isRevealed={!!clue}
                        isTyping={!clue && isCurrentTurn && !hasPlayerSubmitted}
                        isError={clue === "El jugador no ha dado la pista a tiempo"}
                        position="left"
                        playerName={player.name}
                    />
                </div>
            )}
        </li>
    );
}
