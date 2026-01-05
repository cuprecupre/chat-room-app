import React from "react";
import { Button } from "./ui/Button";
import { Clock, Users } from "lucide-react";

/**
 * WaitingForNextGame - Displayed when user joins a room with a match in progress.
 * Shows match progress and options to wait or leave.
 */
export function WaitingForNextGame({
    state,
    onLeaveRoom,
    onCopyLink
}) {
    const hostName = state.players?.find(p => p.uid === state.hostId)?.name || "el anfitrión";
    const currentRound = state.currentRound || 1;
    const maxRounds = state.maxRounds || 3;
    const playerCount = state.players?.length || 0;

    return (
        <div className="w-full max-w-sm mx-auto text-center space-y-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-orange-400" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-serif text-neutral-50">
                Partida en curso
            </h2>

            {/* Subtitle */}
            <p className="text-neutral-400">
                Espera a que termine la partida actual para unirte a la siguiente.
            </p>

            {/* Match Progress Card */}
            <div className="bg-white/5 rounded-xl p-5 space-y-4">
                {/* Round Progress */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Ronda</span>
                    <span className="text-orange-400 font-medium">
                        {currentRound} / {maxRounds}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(currentRound / maxRounds) * 100}%` }}
                    />
                </div>

                {/* Players Info */}
                <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{playerCount} jugadores en la sala</span>
                </div>
            </div>

            {/* Auto-join Message */}
            <div className="flex items-center justify-center gap-2 py-2">
                <svg
                    className="animate-spin h-4 w-4 text-green-400"
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
                <span className="text-green-400 text-sm font-medium">
                    Te unirás automáticamente en la siguiente partida
                </span>
            </div>

            {/* Leave Button */}
            <div className="pt-4">
                <Button
                    onClick={onLeaveRoom}
                    variant="ghost"
                    className="text-neutral-500"
                >
                    Salir de la sala
                </Button>
            </div>
        </div>
    );
}
