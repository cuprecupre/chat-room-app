import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { GameOverScreen } from "./GameOverScreen";
import { RoundStartOverlay } from "./RoundStartOverlay";
import { LobbyScreen } from "./game/LobbyScreen";
import { GameBoard } from "./game/GameBoard";
import { TurnOverlay } from "./game/TurnOverlay";
import { HostLeftScreen } from "./HostLeftScreen";
import { WaitingForNextGame } from "./WaitingForNextGame";

// Components extracted to apps/client/src/components/game/
// - PlayerList.jsx
// - HelpLink.jsx
// - LobbyScreen.jsx
// - GameCard.jsx
// - SpectatorMode.jsx
// - GameBoard.jsx
// - TurnOverlay.jsx

export function GameRoom({
    state,
    isHost,
    user,
    onStartGame,
    onPlayAgain,
    onNextRound,
    onLeaveRoom,
    onLeaveMatch,
    onUpdateOptions,
    onCopyLink,
    onCopyGameCode,
    onVote,
    isMobile,
    onOpenInstructions,
    onKickPlayer,
}) {
    const prevTurnRef = useRef(state.currentRound);
    const prevPhaseRef = useRef(state.phase);

    // UI Animation State
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [isOverlayClosing, setIsOverlayClosing] = useState(false);
    const [eliminatedPlayerInfo, setEliminatedPlayerInfo] = useState(null);
    const [showCardEntrance, setShowCardEntrance] = useState(false);
    const [showRestOfUI, setShowRestOfUI] = useState(true);
    const [initialAnimationPending, setInitialAnimationPending] = useState(false);

    // Modals State

    // Timeouts Refs
    const turnOverlayTimeoutRef = useRef(null);
    const restUITimeoutRef = useRef(null);

    // Detectar cambio de fase para resetear scroll
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [state.phase]);

    // Detectar cambio de ronda y mostrar overlay (TurnOverlay)
    useEffect(() => {
        const prevRound = prevTurnRef.current;
        const currentRound = state.currentRound;

        // Si la ronda cambió y es ronda 2 o superior (nueva ronda), mostrar overlay
        if (
            state.phase === "playing" &&
            prevRound &&
            currentRound > prevRound &&
            currentRound > 1
        ) {
            // No hay jugador eliminado entre rondas (solo en round_result)
            setEliminatedPlayerInfo(null);

            setShowTurnOverlay(true);
            setIsOverlayClosing(false);

            // Iniciar animación de salida después de 2.7 segundos
            if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
            turnOverlayTimeoutRef.current = setTimeout(() => {
                setIsOverlayClosing(true);

                // Ocultar completamente después de la animación (300ms)
                setTimeout(() => {
                    setShowTurnOverlay(false);
                    setIsOverlayClosing(false);
                    setEliminatedPlayerInfo(null);
                }, 300);
            }, 2700);
        }

        prevTurnRef.current = currentRound;
    }, [state.currentRound, state.phase, state.players]);

    // Lógica de Entrada (Card Entrance) cuando empieza playing
    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        const currentPhase = state.phase;

        // Si pasamos a playing desde otra fase
        if (currentPhase === "playing" && prevPhase !== "playing") {
            // Mostrar animación de entrada si viene del lobby o game_over
            const shouldShowAnimation = prevPhase === "lobby" || prevPhase === "game_over";

            if (shouldShowAnimation) {
                // Ocultar el resto de la UI hasta que termine la animación de la carta
                setShowRestOfUI(false);
                setShowCardEntrance(false);
                setInitialAnimationPending(true);

                // Esperar 3000ms (duración del overlay) antes de iniciar animación
                if (restUITimeoutRef.current) clearTimeout(restUITimeoutRef.current);
                restUITimeoutRef.current = setTimeout(() => {
                    setInitialAnimationPending(false);
                    setShowCardEntrance(true);

                    // Después de 800ms (duración de animate-cardEntrance), mostrar el resto de elementos
                    setTimeout(() => {
                        setShowRestOfUI(true);
                        setShowCardEntrance(false);
                    }, 800);
                }, 3000);
            } else {
                // Si no hay animación, mostrar todo inmediatamente
                setShowRestOfUI(true);
                setInitialAnimationPending(false);
            }
        }

        prevPhaseRef.current = currentPhase;
    }, [state.phase]);

    useEffect(() => {
        return () => {
            if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
            if (restUITimeoutRef.current) clearTimeout(restUITimeoutRef.current);
        };
    }, []);

    return (
        <div className="w-full flex flex-col items-center space-y-3 md:space-y-6">
            {state.phase === "lobby" && (
                <LobbyScreen
                    state={state}
                    isHost={isHost}
                    user={user}
                    onCopyLink={onCopyLink}
                    onStartGame={onStartGame}
                    onUpdateOptions={onUpdateOptions}
                    isMobile={isMobile}
                    onVote={onVote}
                    onOpenInstructions={onOpenInstructions}
                    onKickPlayer={onKickPlayer}
                />
            )}

            {/* Host cancelled match - show farewell screen with 4s countdown */}
            {state.phase === "host_cancelled" && (
                <HostLeftScreen
                    onRedirectToLobby={() => {
                        // Server already put everyone back in lobby phase,
                        // client just needs to wait for the next state update
                        // which will show the lobby screen
                    }}
                />
            )}

            {/* Late joiner waiting for next game */}
            {state.phase === "lobby_wait" && (
                <WaitingForNextGame
                    state={state}
                    user={user}
                    onLeaveRoom={onLeaveRoom}
                    onCopyLink={onCopyLink}
                />
            )}


            {/* Mostrar pantalla de playing (incluye round_result para evitar pantalla negra en empates) */}
            {(state.phase === "playing" || state.phase === "round_result") && (
                <GameBoard
                    state={state}
                    user={user}
                    isHost={isHost}
                    onVote={onVote}
                    onCopyLink={onCopyLink}
                    onOpenInstructions={onOpenInstructions}
                    onNextRound={onNextRound}
                    showRestOfUI={showRestOfUI}
                    initialAnimationPending={initialAnimationPending}
                    showCardEntrance={showCardEntrance}
                />
            )}


            {/* Overlay de nueva ronda */}
            {showTurnOverlay && (
                <TurnOverlay
                    roundNumber={state.currentRound}
                    eliminatedPlayerInfo={eliminatedPlayerInfo}
                    isOverlayClosing={isOverlayClosing}
                />
            )}

            <GameOverScreen
                state={state}
                isHost={isHost}
                onPlayAgain={onPlayAgain}
                user={user}
                onCopyLink={onCopyLink}
            />
            <RoundStartOverlay state={state} />

        </div>
    );
}
