import { useTranslation } from "react-i18next";
import { GameHeader } from "./GameHeader";
import { RoundResultOverlay } from "../RoundResultOverlay";
import { PlayerList } from "./PlayerList";
import { GameCard } from "./GameCard";
import { CardPreview } from "./CardPreview";
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
    onKickPlayer,
}) {
    const { t } = useTranslation('game');
    // Detectar si el usuario actual está eliminado
    const isMeEliminated = state.eliminatedPlayers?.includes(user.uid) || false;
    const isChatMode = state.gameMode === 'chat';

    return (
        <>
            {/* Overlay de carga cuando estamos esperando datos (solo si estamos en playing cargando datos) */}
            {state.phase === "playing" && (!state.role || !state.currentRound) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
                </div>
            )}

            {/* Game Header (Stepper + Title) */}
            <div className={`w-full pb-6 sm:pb-8 space-y-6 ${showRestOfUI ? "" : "opacity-0 pointer-events-none"}`}>
                <GameHeader state={state} showAnimation={showRestOfUI} />

                {/* Divider manual */}
                <div className="h-px w-full bg-white/10 mt-6 max-w-4xl mx-auto"></div>
            </div>

            {/* Layout responsive: grid de 2 columnas en md+, stack en mobile */}
            {/* En modo chat (si no estoy eliminado), usamos una sola columna centrada para la lista */}
            <div className={`w-full max-w-4xl mx-auto grid grid-cols-1 ${isChatMode && !isMeEliminated ? 'md:grid-cols-[1fr]' : 'md:grid-cols-[1fr_auto_1fr]'} gap-0 md:gap-10 md:items-stretch`}>
                {/* Columna izquierda: Carta o Modo Espectador */}
                {(!isChatMode || isMeEliminated) && (
                    <div className="w-full max-w-xs mx-auto md:max-w-none pt-8 md:pt-6 pb-8 md:pb-0 border-b border-white/10 md:border-b-0">
                        {isMeEliminated ? (
                            /* Modo Espectador para jugadores eliminados */
                            <SpectatorMode />
                        ) : (
                            /* Carta normal para jugadores activos (Solo Voice Mode) */
                            <GameCard
                                state={state}
                                initialAnimationPending={initialAnimationPending}
                                showCardEntrance={showCardEntrance}
                                showRestOfUI={showRestOfUI}
                            />
                        )}
                    </div>
                )}

                {/* Divider - horizontal en mobile (oculto por nuevo pb-8), vertical en desktop */}
                {(!isChatMode || isMeEliminated) && (
                    <div className="hidden md:block h-px w-full md:h-auto md:w-px bg-white/10 md:self-stretch"></div>
                )}

                {/* Columna derecha: Lista de jugadores */}
                <div
                    className={`w-full max-w-sm mx-auto md:max-w-none md:flex md:flex-col pt-8 md:pt-6 ${showRestOfUI ? "animate-fadeIn animate-delay-800" : "opacity-0 pointer-events-none"}`}
                >
                    <div className="md:sticky md:top-24 md:flex-1 md:flex md:flex-col">
                        {/* Chat Mode: Card Preview is here instead of left column */}
                        {isChatMode && !isMeEliminated && (
                            <div className="flex justify-center md:justify-start mb-6">
                                <CardPreview state={state} />
                            </div>
                        )}


                        <PlayerList
                            players={state.players}
                            currentUserId={user.uid}
                            isHost={isHost}
                            onCopyLink={onCopyLink}
                            gameState={state}
                            onVote={onVote}
                            onOpenInstructions={onOpenInstructions}
                            onKickPlayer={onKickPlayer}
                        />
                    </div>
                </div>
            </div>
            <RoundResultOverlay
                key={`round-result-${state.currentRound}`}
                state={state}
                isHost={isHost}
                onNextRound={onNextRound}
                currentUserId={user.uid}
            />
        </>
    );
}
