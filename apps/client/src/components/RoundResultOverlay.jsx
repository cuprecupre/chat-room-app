import React, { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";

export function RoundResultOverlay({ state, isHost, onNextRound, currentUserId }) {
    if (state.phase !== "round_result") return null;

    // Timer Auto-Advance (30s)
    useEffect(() => {
        if (isHost) {
            const timer = setTimeout(() => {
                onNextRound();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isHost, onNextRound]);

    // Lógica de Resultado (Empate vs Eliminado)
    const lastRoundHistory = state.roundHistory?.[state.roundHistory.length - 1];
    const isTie = lastRoundHistory?.tie;
    const eliminatedId = lastRoundHistory?.eliminated;

    // Identificar al eliminado
    const eliminatedPlayer = eliminatedId ? state.players.find(p => p.uid === eliminatedId) : null;

    // Obtener votantes (Transparencia)
    const votes = lastRoundHistory?.votes || {};
    const votersName = [];

    if (eliminatedId) {
        Object.entries(votes).forEach(([voterId, targetId]) => {
            if (targetId === eliminatedId) {
                const voter = state.players.find(p => p.uid === voterId);
                if (voter) votersName.push(voter.name);
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-neutral-950 animate-fadeIn">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 text-center animate-scaleIn">

                <div className="space-y-8">
                    {/* Caso 1: Alguien eliminado */}
                    {eliminatedPlayer ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-6xl font-serif text-red-500">
                                    {eliminatedPlayer.name}
                                </h2>
                                <p className="text-2xl text-neutral-300">
                                    ha sido eliminado/a
                                </p>
                            </div>


                            <p className="text-sm text-red-500 font-medium uppercase tracking-wider">
                                Votos en contra: {votersName.length}
                            </p>
                        </div>
                    ) : (
                        /* Caso 2: Empate / Nadie eliminado */
                        <div className="space-y-4">
                            <h2 className="text-6xl font-serif text-white">Empate</h2>
                            <p className="text-2xl text-neutral-300">Nadie ha sido eliminado</p>
                        </div>
                    )}

                    <div className="w-16 h-px bg-white/10 mx-auto"></div>

                    <div>
                        <p className="text-2xl font-serif italic text-orange-400">El impostor sigue entre nosotros</p>
                    </div>
                </div>

                {/* Botón Siguiente (Host) */}
                {isHost && (
                    <div className="pt-4">
                        <Button
                            onClick={onNextRound}
                            variant="primary"
                            size="lg"
                            className="!w-auto"
                        >
                            Siguiente Ronda
                        </Button>
                    </div>
                )}
            </div>

            {/* Loading Bar (Bottom - 30s) */}
            <div className="w-full h-3 bg-neutral-900 fixed bottom-0 left-0 right-0">
                <div
                    className="h-full bg-orange-500 origin-left animate-progress"
                    style={{ animationDuration: '10000ms' }}
                ></div>
            </div>
        </div>
    );
}
