import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

export function RoundStartOverlay({ state }) {
    const { t } = useTranslation('game');
    const [visible, setVisible] = useState(false);
    const [displayedRound, setDisplayedRound] = useState(1);
    const prevPhaseRef = useRef(state.phase);
    const prevRoundRef = useRef(state.currentRound);

    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        const prevRound = prevRoundRef.current;

        // Update refs for next render
        prevPhaseRef.current = state.phase;
        prevRoundRef.current = state.currentRound;

        // Don't show overlay when transitioning from clue_round to playing
        // The round already started during clue_round phase
        if (prevPhase === "clue_round" && state.phase === "playing") {
            return;
        }

        // Show overlay when entering playing OR clue_round phase with a new round
        // This covers both Voice Mode (starts in playing) and Chat Mode (starts in clue_round)
        const isGamePhase = state.phase === "playing" || state.phase === "clue_round";
        const prevWasGamePhase = prevPhase === "playing" || prevPhase === "clue_round";

        if (isGamePhase && (!prevWasGamePhase || state.currentRound !== prevRound)) {
            setDisplayedRound(state.currentRound);
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 3000);
            return () => clearTimeout(timer);
        } else if (!isGamePhase) {
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
                        <p className="text-xl uppercase tracking-[0.2em] text-white font-medium mb-1">
                            {t('roundStart.newGame')}
                        </p>
                    )}

                    {displayedRound === 3 && (
                        <p className="text-xl uppercase tracking-[0.2em] text-white font-medium mb-1">
                            {t('roundStart.lastRound')}
                        </p>
                    )}

                    {/* Round Number */}
                    <h1 className="text-7xl font-serif text-orange-400">{t('roundStart.round')} {displayedRound}</h1>

                    {displayedRound === 2 && (
                        <p className="text-2xl text-neutral-300">{t('roundStart.newClueRound')}</p>
                    )}
                    {displayedRound === 3 && (
                        <p className="text-2xl text-neutral-300">
                            {t('roundStart.lastChance')}
                        </p>
                    )}
                </div>

                <div className="w-16 h-px bg-white/10 mx-auto"></div>

                {/* Starting Player - Solo en Ronda 1 */}
                {startingPlayer && displayedRound === 1 && (
                    <div className="space-y-2">
                        <p className="text-xl text-neutral-400">{t('roundStart.firstTurnFor')}</p>
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
