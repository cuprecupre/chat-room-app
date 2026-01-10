import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";

export function RoundResultOverlay({ state, isHost, onNextRound, currentUserId }) {
    const { t } = useTranslation('common');
    const isActive = state.phase === "round_result";

    // Hook SIEMPRE se ejecuta (regla de hooks), condición DENTRO
    useEffect(() => {
        if (isActive && isHost) {
            const timer = setTimeout(() => {
                onNextRound();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isActive, isHost, onNextRound]);

    // Early return DESPUÉS de hooks
    if (!isActive) return null;

    // Lógica de Resultado (Empate vs Eliminado)
    const lastRoundHistory = state.roundHistory?.[state.roundHistory.length - 1];
    const eliminatedId = lastRoundHistory?.eliminated;

    // Identificar al eliminado
    const eliminatedPlayer = eliminatedId
        ? state.players.find((p) => p.uid === eliminatedId)
        : null;

    // Obtener votantes
    const votes = lastRoundHistory?.votes || {};
    const votersName = [];

    if (eliminatedId) {
        Object.entries(votes).forEach(([voterId, targetId]) => {
            if (targetId === eliminatedId) {
                const voter = state.players.find((p) => p.uid === voterId);
                if (voter) votersName.push(voter.name);
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-sm animate-fadeIn">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 text-center animate-scaleIn">
                <div className="space-y-8">
                    {eliminatedPlayer ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-6xl font-serif text-red-500">
                                    {eliminatedPlayer.name}
                                </h2>
                                <p className="text-2xl text-neutral-300">{t('game.hasBeenEliminated')}</p>
                            </div>
                            <p className="text-sm text-red-500 font-medium uppercase tracking-wider">
                                {t('game.votesAgainst')}: {votersName.length}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-6xl font-serif text-white">{t('game.tie')}</h2>
                            <p className="text-2xl text-neutral-300">{t('game.nobodyEliminated')}</p>
                        </div>
                    )}

                    <div className="w-16 h-px bg-white/10 mx-auto"></div>

                    <div>
                        <p className="text-2xl font-serif italic text-orange-400">
                            {t('game.impostorRemains')}
                        </p>
                    </div>
                </div>

                {isHost && (
                    <div className="pt-4">
                        <Button
                            onClick={onNextRound}
                            variant="primary"
                            size="lg"
                            className="!w-auto"
                        >
                            {t('buttons.nextRound')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="w-full h-3 bg-neutral-900 fixed bottom-0 left-0 right-0">
                <div
                    className="h-full bg-orange-500 origin-left animate-progress"
                    style={{ animationDuration: "4000ms" }}
                ></div>
            </div>
        </div>
    );
}
