import React, { useEffect, useState } from "react";

export function RoundStartOverlay({ state }) {
    const [visible, setVisible] = useState(false);
    const [displayedRound, setDisplayedRound] = useState(1);

    useEffect(() => {
        if (state.phase === "playing") {
            setDisplayedRound(state.currentRound);
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [state.currentRound, state.phase]);

    if (!visible) return null;

    const startingPlayer = state.players.find((p) => p.uid === state.startingPlayerId);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn pointer-events-none">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 text-center animate-scaleIn">
                <div className="space-y-6">
                    {displayedRound === 1 && (
                        <p className="text-xl uppercase tracking-[0.2em] text-orange-400 font-medium mb-1">
                            Nueva partida
                        </p>
                    )}

                    {/* Round Number */}
                    <h1 className="text-7xl font-serif text-orange-400">Ronda {displayedRound}</h1>

                    {displayedRound === 2 && (
                        <p className="text-2xl text-neutral-300">Nueva ronda de pistas</p>
                    )}
                    {displayedRound === 3 && (
                        <p className="text-2xl text-neutral-300">
                            Última oportunidad para descubrir al impostor
                        </p>
                    )}
                </div>

                <div className="w-16 h-px bg-white/10 mx-auto"></div>

                {/* Starting Player - Solo en Ronda 1 */}
                {startingPlayer && displayedRound === 1 && (
                    <div className="space-y-2">
                        <p className="text-xl text-neutral-400">El primer turno es para:</p>
                        <p className="text-2xl font-serif text-white">
                            {startingPlayer.name}
                        </p>
                    </div>
                )}
            </div>

            {/* Loading Bar (Bottom) */}
            <div className="w-full h-3 bg-white/10 fixed bottom-0 left-0 right-0">
                <div
                    className="h-full bg-orange-500 origin-left animate-progress"
                    style={{ animationDuration: "3000ms" }}
                ></div>
            </div>
        </div>
    );
}
