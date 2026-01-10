import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Users } from "lucide-react";
import { PlayerList } from "./game/PlayerList";


/**
 * WaitingForNextGame - Displayed when user joins a room with a match in progress.
 * Shows match progress and options to wait or leave.
 */
export function WaitingForNextGame({
    state,
    user,
    onLeaveRoom,
    onCopyLink
}) {
    const { t } = useTranslation('game');
    const host = state.players?.find((p) => p.uid === state.hostId);
    const hostName = host ? host.name.toUpperCase() : t('lobby.host', 'THE HOST');

    const activePlayers = state.players?.filter(p => !p.isLateJoiner) || [];
    const waitingPlayers = state.players?.filter(p => p.isLateJoiner) || [];

    return (
        <div className="w-full max-w-sm mx-auto text-center space-y-4 pb-32 pt-10 px-0">
            {/* Room Identifier Badge */}
            <div className="flex items-center justify-center mb-6 animate-fadeIn">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 rounded-full">
                    {t('waitingNextGame.roomOf', "ROOM OF")} {hostName}
                </span>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-serif text-neutral-50 leading-tight">
                {t('waitingNextGame.title')}
            </h2>

            {/* Auto-join Message */}
            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <svg
                    className="animate-spin h-3 w-3 text-orange-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <span className="text-orange-400 text-sm font-medium">
                    {t('waitingNextGame.autoJoin', "You'll automatically join the next game")}
                </span>
            </div>

            {/* Lists Container */}
            <div className="w-full pt-4 space-y-8">
                {/* Waiting Players List */}
                {waitingPlayers.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-neutral-400 text-left px-1">
                            {t('waitingNextGame.waitingToEnter', 'Waiting to enter')}: {waitingPlayers.length}
                        </div>
                        <PlayerList
                            players={waitingPlayers}
                            currentUserId={user?.uid || ""}
                            isHost={false}
                            gameState={state}
                        />
                    </div>
                )}

                {/* Active Players List */}
                {activePlayers.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-neutral-400 text-left px-1">
                            {t('waitingNextGame.playersInGame')}: {activePlayers.length}
                        </div>
                        <PlayerList
                            players={activePlayers}
                            currentUserId={user?.uid || ""}
                            isHost={false}
                            gameState={state}
                        />
                    </div>
                )}
            </div>


        </div>
    );
}
