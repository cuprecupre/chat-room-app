import React from "react";
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
    const host = state.players?.find((p) => p.uid === state.hostId);
    const hostName = host ? host.name.toUpperCase() : "EL ANFITRIÓN";

    const activePlayers = state.players?.filter(p => !p.isLateJoiner) || [];
    const waitingPlayers = state.players?.filter(p => p.isLateJoiner) || [];

    return (
        <div className="w-full max-w-sm mx-auto text-center space-y-4 pb-32 pt-10 px-0">
            {/* Room Identifier Badge */}
            <div className="flex items-center justify-center mb-6 animate-fadeIn">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 rounded-full">
                    SALA DE {hostName}
                </span>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-serif text-neutral-50 leading-tight">
                Partida en curso
            </h2>

            {/* Auto-join Message */}
            <div className="flex items-center justify-center gap-2 py-2 animate-pulse">
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
                    Te unirás automáticamente en la siguiente partida
                </span>
            </div>

            {/* Lists Container */}
            <div className="w-full pt-4 space-y-8">
                {/* Active Players List */}
                {activePlayers.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-neutral-400 text-left px-1">
                            Jugadores en la partida
                        </div>
                        <PlayerList
                            players={activePlayers}
                            currentUserId={user?.uid || ""}
                            isHost={false}
                            gameState={state}
                        />
                    </div>
                )}

                {/* Waiting Players List */}
                {waitingPlayers.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-neutral-400 text-left px-1">
                            Esperando para entrar
                        </div>
                        <PlayerList
                            players={waitingPlayers}
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
