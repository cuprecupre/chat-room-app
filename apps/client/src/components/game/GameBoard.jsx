import React from "react";
import { GameStepper } from "../ui/GameStepper";
import { RoundResultOverlay } from "../RoundResultOverlay";
import { PlayerList } from "./PlayerList";
import { GameCard } from "./GameCard";
import { SpectatorMode } from "./SpectatorMode";

export function GameBoard({
    state,
    user,
    isHost,
    onVote,
    onCopyLink,
    onOpenInstructions,
    onNextRound,
    showRestOfUI,
    initialAnimationPending,
    showCardEntrance,
}) {
    // Detectar si el usuario actual está eliminado
    const isMeEliminated = state.eliminatedPlayers?.includes(user.uid) || false;

    return (
        <>
            {/* Overlay de carga cuando estamos esperando datos (solo si estamos en playing cargando datos) */}
            {state.phase === "playing" && (!state.role || !state.currentRound) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
                </div>
            )}

            {/* Stepper de partida y rondas */}
            <div
                className={`w-full ${showRestOfUI ? "" : "opacity-0 pointer-events-none"}`}
            >
                <GameStepper
                    roundCount={state.currentRound || 1}
                    currentTurn={state.currentRound}
                    showAnimation={showRestOfUI}
                />
            </div>

            {/* Layout responsive: grid de 2 columnas en md+, stack en mobile */}
            <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-10 md:items-stretch">
                {/* Columna izquierda: Carta o Modo Espectador */}
                <div className="w-full max-w-xs mx-auto md:max-w-none pt-8 md:pt-6 pb-8 md:pb-0 border-b border-white/10 md:border-b-0">
                    {isMeEliminated ? (
                        /* Modo Espectador para jugadores eliminados */
                        <SpectatorMode />
                    ) : (
                        /* Carta normal para jugadores activos */
                        <GameCard
                            state={state}
                            initialAnimationPending={initialAnimationPending}
                            showCardEntrance={showCardEntrance}
                            showRestOfUI={showRestOfUI}
                        />
                    )}
                </div>

                {/* Divider - horizontal en mobile (oculto por nuevo pb-8), vertical en desktop */}
                <div className="hidden md:block h-px w-full md:h-auto md:w-px bg-white/10 md:self-stretch"></div>

                {/* Columna derecha: Lista de jugadores */}
                <div
                    className={`w-full max-w-sm mx-auto md:max-w-none md:flex md:flex-col pt-8 md:pt-6 ${showRestOfUI ? "animate-fadeIn animate-delay-800" : "opacity-0 pointer-events-none"}`}
                >
                    <div className="md:sticky md:top-24 md:flex-1 md:flex md:flex-col">
                        <div
                            className={`text-center md:text-left mb-5 ${showRestOfUI ? "animate-fadeIn animate-delay-400" : "opacity-0 pointer-events-none"}`}
                        >
                            <h2 className="text-3xl font-serif text-neutral-50">
                                Ronda de pistas y votos
                            </h2>
                        </div>
                        <PlayerList
                            players={state.players}
                            currentUserId={user.uid}
                            isHost={isHost}
                            onCopyLink={onCopyLink}
                            gameState={state}
                            onVote={onVote}
                            onOpenInstructions={onOpenInstructions}
                        />
                    </div>
                </div>
            </div>
            <RoundResultOverlay
                state={state}
                isHost={isHost}
                onNextRound={onNextRound}
                currentUserId={user.uid}
            />
        </>
    );
}
