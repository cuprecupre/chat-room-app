import React, { useEffect, useRef, useState } from "react";
import { Link, Share, Info } from "lucide-react";
// removed icons from labels
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { Modal } from "./ui/Modal";
import { GameStepper } from "./ui/GameStepper";
import { Footer } from "./Footer";
import keyImg from "../assets/llave.jpg";
import dualImpostorImg from "../assets/dual-impostor.jpg";
import cardImg from "../assets/card.jpg";
import cardBackImg from "../assets/card-back.jpg";
import { RoundResultOverlay } from "./RoundResultOverlay";
import { GameOverScreen } from "./GameOverScreen";
import { RoundStartOverlay } from "./RoundStartOverlay";

export function PlayerList({
    players,
    currentUserId,
    isHost,
    onCopyLink,
    gameState,
    onVote,
    onOpenInstructions,
}) {
    const isPlaying = gameState?.phase === "playing";
    const isRoundResult = gameState?.phase === "round_result";
    const isGameOver = gameState?.phase === "game_over";
    const showScores = isRoundResult || isGameOver;

    const canVote = isPlaying && gameState?.canVote;
    const hasVoted = gameState?.hasVoted;
    const votedPlayers = gameState?.votedPlayers || [];
    const eliminatedPlayers = gameState?.eliminatedPlayers || [];
    const activePlayers = gameState?.activePlayers || [];
    const myVote = gameState?.myVote || null; // A quién voté yo
    const playerScores = gameState?.playerScores || {};
    const lastRoundScores = gameState?.lastRoundScores || {};
    const playerOrder = gameState?.playerOrder || [];
    const startingPlayerId = gameState?.startingPlayerId;

    // Permitir cambiar voto solo si no todos han votado aún
    const allVoted = votedPlayers.length === activePlayers.length;
    const canChangeVote = hasVoted && !allVoted;

    // Detectar ganadores en caso de empate
    const isTie = gameState?.winner === "Empate";
    const winners = isTie
        ? (() => {
            const maxScore = Math.max(...Object.values(playerScores));
            return players.filter((player) => (playerScores[player.uid] || 0) === maxScore);
        })()
        : [];

    // Si hay 3 o más ganadores, no hay ganadores reales
    const hasNoWinners = winners.length >= 3;

    // Ordenar jugadores según el contexto
    const sortedPlayers = [...players].sort((a, b) => {
        // Si mostramos puntos, ordenar por puntuación
        if (showScores) {
            return (playerScores[b.uid] || 0) - (playerScores[a.uid] || 0);
        }
        // Si hay playerOrder (orden base), usarlo
        if (playerOrder.length > 0) {
            const indexA = playerOrder.indexOf(a.uid);
            const indexB = playerOrder.indexOf(b.uid);
            // Si ambos están en el orden, ordenar por índice
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            // Si solo uno está, el que está va primero
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
        }
        // Fallback: usuario actual siempre primero
        if (a.uid === currentUserId) return -1;
        if (b.uid === currentUserId) return 1;
        // Ordenar por nombre
        return a.name.localeCompare(b.name);
    });

    const handleImageError = (e) => {
        console.log("❌ Error cargando imagen:", e.target.src);
        // Si la imagen falla, mostrar iniciales del nombre
        const name = e.target.alt || "U";
        const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        e.target.style.display = "none";
        e.target.nextSibling.textContent = initials;
        e.target.nextSibling.style.display = "flex";
    };

    const canVoteFor = (playerId) => {
        return (
            canVote &&
            playerId !== currentUserId &&
            !eliminatedPlayers.includes(playerId) &&
            activePlayers.includes(playerId)
        );
    };

    const isMyVote = (playerId) => {
        return myVote === playerId;
    };

    return (
        <div className="w-full rounded-lg md:flex-1 md:flex md:flex-col">
            {/* Indicador de quién empieza la ronda */}

            <ul className="space-y-2">
                {sortedPlayers.map((p, index) => {
                    const isEliminated = eliminatedPlayers.includes(p.uid);
                    const hasVoted = votedPlayers.includes(p.uid);
                    const showVoteButton = canVoteFor(p.uid);
                    const iVotedForThisPlayer = isMyVote(p.uid);
                    const score = playerScores[p.uid] || 0;
                    const scoreGained = lastRoundScores[p.uid] || 0;
                    // Marcar como ganador a todos los que tengan el puntaje más alto
                    const maxScore = Math.max(...Object.values(playerScores));
                    const isWinner = isGameOver && score === maxScore;

                    return (
                        <li
                            key={p.uid}
                            className={`flex items-center justify-between bg-white/5 p-4 rounded-md ${isWinner ? "bg-orange-500/10" : ""}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar photoURL={p.photoURL} displayName={p.name} size="sm" />
                                    {/* Check verde solo si este usuario ya votó (todos lo ven) */}
                                    {isPlaying && hasVoted && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-950 flex items-center justify-center">
                                            <svg
                                                className="w-2.5 h-2.5 text-black"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    {!isPlaying && !showScores && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-950"></div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                        <span
                                            className={`font-medium ${isWinner ? "text-orange-400" : ""}`}
                                        >
                                            {p.name}
                                            {p.uid === currentUserId ? " (Tú)" : ""}
                                            {isWinner && " 🏆"}
                                        </span>
                                        {/* Indicador de eliminado en vista de puntuación */}
                                        {isRoundResult && isEliminated && (
                                            <span className="text-xs text-red-400 font-medium">
                                                Eliminado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Indicador de jugador inicial */}
                                        {isPlaying && startingPlayerId === p.uid && (
                                            <span
                                                className="text-orange-400 text-sm"
                                                title="Empieza esta ronda"
                                            >
                                                ☀️
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Mostrar puntos o botón de votar según fase */}
                            <div className="flex items-center gap-3">
                                {isEliminated && isPlaying && (
                                    <span className="text-xs text-red-400 font-medium">
                                        Eliminado
                                    </span>
                                )}
                                {showScores ? (
                                    <div className="text-right">
                                        {isRoundResult ? (
                                            // Mostrar puntos ganados y total en resultado de ronda (para todos)
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div
                                                    className={`text-xs font-medium ${scoreGained > 0 ? "text-green-400" : "text-neutral-500"}`}
                                                >
                                                    {scoreGained > 0 ? "+" : ""}
                                                    {scoreGained} pts
                                                </div>
                                                <div
                                                    className={`text-sm ${isWinner ? "text-orange-400" : "text-neutral-400"}`}
                                                >
                                                    Total: {score}
                                                </div>
                                            </div>
                                        ) : (
                                            // Solo mostrar total en game over
                                            <span
                                                className={`font-medium ${isWinner ? "text-orange-400" : "text-neutral-300"}`}
                                            >
                                                {score} pts
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    isPlaying &&
                                    canVote &&
                                    // Mostrar botón solo si:
                                    // 1. No he votado aún (mostrar todos los botones)
                                    // 2. Ya voté por este jugador (mostrar solo este botón)
                                    (myVote === null || iVotedForThisPlayer) &&
                                    showVoteButton && (
                                        <Button
                                            onClick={() => {
                                                // Si ya voté por este jugador y puedo cambiar voto, quitar el voto
                                                if (iVotedForThisPlayer && canChangeVote) {
                                                    onVote(null);
                                                } else {
                                                    // Votar por este jugador
                                                    onVote(p.uid);
                                                }
                                            }}
                                            variant="outline"
                                            size="sm"
                                            disabled={iVotedForThisPlayer && !canChangeVote}
                                            className={`!w-auto gap-2 px-4 ${iVotedForThisPlayer
                                                ? canChangeVote
                                                    ? "!border-green-500 !text-green-400 !bg-green-500/10 hover:!bg-green-500/20"
                                                    : "!border-green-500 !text-green-400 !bg-green-500/10 !hover:bg-green-500/10 cursor-not-allowed"
                                                : ""
                                                }`}
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                                                />
                                            </svg>
                                            <span>{iVotedForThisPlayer ? "Votado" : "Votar"}</span>
                                        </Button>
                                    )
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Indicador de quién empieza la ronda */}
            {isPlaying && startingPlayerId && (
                <p className="text-sm text-neutral-400 mt-4 text-center md:text-left">
                    ☀️{" "}
                    <span className="text-orange-400 font-medium">
                        {players.find((p) => p.uid === startingPlayerId)?.name || "Alguien"}
                    </span>{" "}
                    da la primera pista
                </p>
            )}

            {/* Pasos del juego */}


            {/* Enlace de ayuda solo durante la fase playing */}
            {isPlaying && <HelpLink onOpenInstructions={onOpenInstructions} />}
        </div>
    );
}

function HelpLink({ onOpenInstructions }) {
    const [showModal, setShowModal] = useState(false);

    const handleOpenFullRules = () => {
        setShowModal(false);
        if (onOpenInstructions) {
            onOpenInstructions();
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="mt-10 text-sm text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2 w-full text-center md:text-left flex items-center justify-center md:justify-start gap-1.5"
            >
                <Info className="w-4 h-4" />
                ¿Cómo jugar?
            </button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="¿Cómo jugar?"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="space-y-4 text-neutral-300">
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">1.</span>
                            <span>
                                Voltea tu carta y descubre si eres{" "}
                                <strong className="text-white">amigo</strong> (verás la palabra
                                secreta) o <strong className="text-orange-400">impostor</strong> (no
                                la verás).
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">2.</span>
                            <span>
                                Cada jugador dice una pista en voz alta. Empieza el que tenga el ☀️
                                indicado en el listado de jugadores.
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">3.</span>
                            <span>
                                <strong className="text-white">Si eres amigo:</strong> Di en voz alta una pista
                                sutil que demuestre que conoces la palabra, pero sin revelarla.
                                <br />
                                <strong className="text-orange-400">Si eres impostor:</strong> Finge
                                que la conoces usando pistas vagas o que imiten a otros.
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">4.</span>
                            <span>Cuando todos hayan dado su pista, ¡es hora de votar!</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">5.</span>
                            <span>
                                Vota a quien creas que es el impostor. Si eres tú, intenta
                                incriminar a otro.
                            </span>
                        </p>
                    </div>

                    <div className="text-sm text-neutral-500 border-l-2 border-neutral-700 pl-4">
                        Los que votan bien ganan puntos. Si eres impostor y sobrevives, ganas
                        puntos. Si no eres impostor pero la mayoría te vota, quedas eliminado de la
                        ronda.
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => setShowModal(false)}
                            variant="primary"
                            size="md"
                            className="w-full"
                        >
                            Entendido
                        </Button>
                        <button
                            onClick={handleOpenFullRules}
                            className="w-full text-sm text-neutral-500 hover:text-orange-400 transition-colors underline underline-offset-2"
                        >
                            Ver reglas completas del juego
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export function GameRoom({
    state,
    isHost,
    user,
    onStartGame,
    onEndGame,
    onPlayAgain,
    onNextRound,
    onMigrateGame,
    onLeaveGame,
    onCopyLink,
    onCopyGameCode,
    onVote,
    isMobile,
    onOpenInstructions,
    showEndGameModal: showEndGameModalProp,
    onShowEndGameModal,
}) {
    const capitalize = (s) =>
        typeof s === "string" && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const prevPlayersRef = useRef(state.players);
    const prevTurnRef = useRef(state.currentRound);
    const prevPhaseRef = useRef(state.phase);
    const [reveal, setReveal] = useState(false);
    const [showTurnOverlay, setShowTurnOverlay] = useState(false);
    const [isOverlayClosing, setIsOverlayClosing] = useState(false);
    const [eliminatedPlayerInfo, setEliminatedPlayerInfo] = useState(null);
    const [showCardEntrance, setShowCardEntrance] = useState(false);
    const [showRestOfUI, setShowRestOfUI] = useState(true);
    const [showEndGameModalInternal, setShowEndGameModalInternal] = useState(false);

    // Usar props si están definidas, sino usar estado interno
    const showEndGameModal =
        showEndGameModalProp !== undefined ? showEndGameModalProp : showEndGameModalInternal;
    const setShowEndGameModal = onShowEndGameModal || setShowEndGameModalInternal;
    const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
    const [cardAnimating, setCardAnimating] = useState(false); // Controla si la animación está activa
    const revealTimeoutRef = useRef(null);
    const turnOverlayTimeoutRef = useRef(null);
    const restUITimeoutRef = useRef(null);
    const cardFloatTimeoutRef = useRef(null);
    const cardStopTimeoutRef = useRef(null);

    // Referencia para tracking de jugadores (sin toast - el servidor lo maneja)
    useEffect(() => {
        prevPlayersRef.current = state.players;
    }, [state.players]);

    // Detectar cambio de fase para resetear scroll
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [state.phase]);

    // Reveal helpers
    const triggerReveal = () => {
        if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

        const newRevealState = !reveal;
        setReveal(newRevealState);

        // Si voltea la carta (muestra el dorso), iniciar temporizador para volver al frente después de 5 segundos
        if (newRevealState) {
            revealTimeoutRef.current = setTimeout(() => {
                setReveal(false);
            }, 5000);
        }
    };

    // Detectar cambio de ronda y mostrar overlay
    useEffect(() => {
        const prevRound = prevTurnRef.current;
        const currentRound = state.currentRound;

        // Si la ronda cambió y es ronda 2 o superior (nueva ronda), mostrar overlay y resetear carta
        if (
            state.phase === "playing" &&
            prevRound &&
            currentRound > prevRound &&
            currentRound > 1
        ) {
            // Resetear carta al estado frontal
            setReveal(false);

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

    // Resetear carta cuando empieza una nueva partida (playing)
    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        const currentPhase = state.phase;

        // Si pasamos a playing desde otra fase, resetear carta
        if (currentPhase === "playing" && prevPhase !== "playing") {
            setReveal(false);

            // Mostrar animación de entrada si viene del lobby, game_over o round_result
            const shouldShowAnimation =
                prevPhase === "lobby" || prevPhase === "game_over" || prevPhase === "round_result";

            if (shouldShowAnimation) {
                // Ocultar el resto de la UI hasta que termine la animación de la carta
                setShowRestOfUI(false);
                setShowCardEntrance(true);

                // Después de 800ms (duración de animate-cardEntrance), mostrar el resto de elementos
                if (restUITimeoutRef.current) clearTimeout(restUITimeoutRef.current);
                restUITimeoutRef.current = setTimeout(() => {
                    setShowRestOfUI(true);
                }, 800);

                // Quitar la animación después de que termine
                setTimeout(() => {
                    setShowCardEntrance(false);
                }, 800);
            } else {
                // Si no hay animación, mostrar todo inmediatamente
                setShowRestOfUI(true);
            }
        }

        prevPhaseRef.current = currentPhase;
    }, [state.phase]);

    useEffect(() => {
        return () => {
            if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
            if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
            if (restUITimeoutRef.current) clearTimeout(restUITimeoutRef.current);
            if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
        };
    }, []);

    // Iniciar animación de carta al entrar en fase playing
    useEffect(() => {
        if (state.phase === "playing") {
            setCardAnimating(true);

            // La animación dura 7s y se detiene sola (forwards)
            // Actualizar estado después de 7s para limpiar
            if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
            cardFloatTimeoutRef.current = setTimeout(() => {
                setCardAnimating(false);
            }, 7000);
        }

        return () => {
            if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
        };
    }, [state.phase]);

    return (
        <div className="w-full flex flex-col items-center space-y-3 md:space-y-6">
            {/* Pantalla de migración para partidas con sistema antiguo */}
            {state.phase === "needs_migration" && (
                <div className="w-full max-w-sm mx-auto text-center space-y-6 py-8">
                    <div className="mx-auto w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-5xl">🔄</span>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-serif text-neutral-50">
                            ¡Nueva versión disponible!
                        </h2>
                        <p className="text-neutral-400 text-lg leading-relaxed">
                            Hemos mejorado el sistema de juego.
                            <br />
                            Tu partida anterior necesita actualizarse.
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5 text-left space-y-3">
                        <p className="text-neutral-300 text-sm">
                            <strong className="text-orange-400">¿Qué pasará?</strong>
                        </p>
                        <ul className="text-neutral-400 text-sm space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Se creará una nueva sala automáticamente</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Todos los jugadores serán movidos juntos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                <span>Podrán empezar una nueva partida inmediatamente</span>
                            </li>
                        </ul>
                    </div>

                    {isHost ? (
                        <Button
                            onClick={onMigrateGame}
                            variant="primary"
                            size="lg"
                            className="w-full"
                        >
                            Continuar a nueva sala
                        </Button>
                    ) : (
                        <div className="text-neutral-500 text-sm animate-pulse">
                            Esperando a que el anfitrión actualice la partida...
                        </div>
                    )}
                </div>
            )}

            {state.phase === "lobby" && (
                <div className="w-full max-w-sm mx-auto text-center space-y-4 pb-24 sm:pb-0">
                    {/* Header Image - 50% smaller (w-28 h-28) */}
                    <img
                        src={dualImpostorImg}
                        alt="Lobby"
                        className="mx-auto w-28 h-28 rounded-full object-cover shadow-lg ring-1 ring-white/10"
                        loading="lazy"
                    />

                    {isHost ? (
                        /* HOST VIEW */
                        <>
                            <h2 className="text-4xl font-serif text-neutral-50 leading-tight">
                                Invita a tus amigos
                                <br />
                                para empezar
                            </h2>

                            <div className="w-full space-y-4 mt-8">
                                <Button
                                    onClick={onCopyLink}
                                    variant="outline"
                                    size="md"
                                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2"
                                >
                                    {isMobile ? (
                                        <Share className="w-4 h-4" />
                                    ) : (
                                        <Link className="w-4 h-4" />
                                    )}
                                    {isMobile
                                        ? "Compartir invitación"
                                        : "Copiar enlace de la partida"}
                                </Button>

                                <p className="text-lg text-neutral-400 font-regular">
                                    Espera a que se unan los jugadores...
                                </p>

                                <div className="w-full pt-2">
                                    <PlayerList
                                        players={state.players}
                                        currentUserId={user.uid}
                                        isHost={isHost}
                                        onCopyLink={onCopyLink}
                                        gameState={state}
                                        onVote={onVote}
                                    />
                                </div>

                                {/* Botón fijo en mobile, normal en desktop */}
                                <div className="hidden sm:block">
                                    <Button
                                        onClick={onStartGame}
                                        disabled={state.players.length < 2}
                                        variant="primary"
                                        size="md"
                                        className="w-full"
                                    >
                                        Comenzar juego
                                    </Button>
                                </div>
                            </div>

                            {/* Botón fijo solo en mobile con overlay gradiente premium (como Siguiente partida) */}
                            <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40">
                                <div className="h-10 bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-transparent"></div>
                                <div className="bg-neutral-950 px-4 pb-8">
                                    <div className="max-w-sm mx-auto">
                                        <Button
                                            onClick={onStartGame}
                                            disabled={state.players.length < 2}
                                            variant="primary"
                                            size="md"
                                            className="w-full shadow-lg"
                                        >
                                            Comenzar juego
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* GUEST VIEW */
                        <>
                            <h2 className="text-4xl font-serif text-neutral-50 leading-tight">
                                La partida empezará pronto
                            </h2>

                            <div className="space-y-6 mt-8">
                                <p className="text-lg text-neutral-400 animate-pulse">
                                    Espera hasta que{" "}
                                    <span className="text-orange-400 font-regular">
                                        {state.players.find((p) => p.uid === state.hostId)?.name ||
                                            "el anfitrión"}
                                    </span>
                                    <br />
                                    inicie la partida
                                    <span className="inline-flex ml-1">
                                        <span
                                            className="animate-bounce"
                                            style={{ animationDelay: "0ms" }}
                                        >
                                            .
                                        </span>
                                        <span
                                            className="animate-bounce"
                                            style={{ animationDelay: "150ms" }}
                                        >
                                            .
                                        </span>
                                        <span
                                            className="animate-bounce"
                                            style={{ animationDelay: "300ms" }}
                                        >
                                            .
                                        </span>
                                    </span>
                                </p>

                                <div className="w-full">
                                    <PlayerList
                                        players={state.players}
                                        currentUserId={user.uid}
                                        isHost={isHost}
                                        onCopyLink={onCopyLink}
                                        gameState={state}
                                        onVote={onVote}
                                    />
                                </div>

                                <div className="pt-4 space-y-3">
                                    <p className="text-sm text-neutral-500">
                                        También puedes invitar amigos a esta partida
                                    </p>
                                    <Button
                                        onClick={onCopyLink}
                                        variant="outline"
                                        size="md"
                                        className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2"
                                    >
                                        {isMobile ? (
                                            <Share className="w-4 h-4" />
                                        ) : (
                                            <Link className="w-4 h-4" />
                                        )}
                                        {isMobile
                                            ? "Compartir invitación"
                                            : "Copiar enlace de la partida"}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Mostrar pantalla de playing si estamos en playing o round_result (Overlay handling) */}
            {(state.phase === "playing" || state.phase === "round_result") && (
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
                        {/* Columna izquierda: Carta */}
                        <div className="w-full max-w-xs mx-auto md:max-w-none pt-8 md:pt-6 pb-8 md:pb-0 border-b border-white/10 md:border-b-0">
                            <div className="space-y-3">
                                <div
                                    className={`${showCardEntrance ? "animate-cardEntrance" : ""}`}
                                >
                                    <div
                                        className={`flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full ${cardAnimating ? "animate-card-float-complete" : ""}`}
                                    >
                                        <div
                                            className={`flip-card-inner h-full cursor-pointer ${reveal ? "is-flipped" : ""}`}
                                            onClick={triggerReveal}
                                            title="Toca para voltear la carta"
                                        >
                                            {/* Frente completo (card completa con imagen) */}
                                            <div className="flip-card-front">
                                                <div className="h-full flex items-center justify-center">
                                                    <img
                                                        src={cardImg}
                                                        alt="Frente de la carta"
                                                        className="w-full h-full object-cover rounded-xl pointer-events-none"
                                                        title="Ver mi carta"
                                                    />
                                                </div>
                                            </div>
                                            {/* Dorso completo (card completa con información) */}
                                            <div className="flip-card-back">
                                                <div className="relative h-full flex flex-col items-center justify-center rounded-xl overflow-hidden">
                                                    {/* Imagen de fondo */}
                                                    <img
                                                        src={cardBackImg}
                                                        alt="Fondo del dorso"
                                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                                    />
                                                    {/* Contenido sobre la imagen */}
                                                    <div
                                                        className="relative z-10 text-center p-8 backdrop-blur-sm rounded-xl pointer-events-none"
                                                        title="Volver al frente"
                                                    >
                                                        <div className="space-y-4">
                                                            <div>
                                                                <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-orange-400">
                                                                    <span>Tu rol</span>
                                                                </div>
                                                                <p className="text-xl font-serif mt-1 text-white">
                                                                    {capitalize(state.role)}
                                                                </p>
                                                            </div>

                                                            {/* Línea separadora */}
                                                            <div className="w-full h-px bg-white/20"></div>

                                                            {state.role === "impostor" ? (
                                                                <>
                                                                    {state.secretCategory && (
                                                                        <div>
                                                                            <div className="flex flex-col items-center justify-center gap-1 text-xs tracking-wider text-orange-400">
                                                                                <span className="uppercase">
                                                                                    Pista:
                                                                                </span>
                                                                                <span className="normal-case">
                                                                                    La palabra
                                                                                    secreta está
                                                                                    relacionada
                                                                                    con...
                                                                                </span>
                                                                            </div>
                                                                            <p className="font-serif text-xl mt-1 text-white underline decoration-dotted underline-offset-4">
                                                                                {capitalize(
                                                                                    state.secretCategory
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div>
                                                                    <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-orange-400">
                                                                        <span>Palabra secreta</span>
                                                                    </div>
                                                                    <p className="font-serif text-xl mt-1 text-white">
                                                                        {capitalize(
                                                                            state.secretWord
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Botón Girar carta */}
                                <div
                                    className={`flex justify-center mt-6 ${showRestOfUI ? "animate-fadeIn animate-delay-600" : "opacity-0 pointer-events-none"}`}
                                >
                                    <Button
                                        onClick={triggerReveal}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 !w-auto !border-orange-500 !text-orange-400 hover:!bg-orange-500/10"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        <span>Descubre tu carta</span>
                                    </Button>
                                </div>
                            </div>
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
            )}

            {/* Resultado de partida (Desactivado - Ahora Overlay) */}
            {false && state.phase === "round_result" && state.impostorName && state.secretWord && (
                <div className="w-full max-w-4xl mx-auto animate-fadeIn">
                    {/* Header con partida info - alineado a la izquierda */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 md:justify-start justify-center">
                            {state.roundCount && state.maxRounds && (
                                <span className="text-xs text-neutral-500">
                                    Partida {state.roundCount} de {state.maxRounds}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Layout responsive: grid de 2 columnas en md+, stack en mobile (items-stretch por defecto) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-10">
                        {/* Columna izquierda: Resultado */}
                        <div className="w-full max-w-sm mx-auto md:max-w-none flex flex-col">
                            <h2 className="text-3xl font-serif text-neutral-50 mb-5 text-center md:text-left">
                                Resultado de la partida
                            </h2>

                            {/* Revelar impostor y palabra */}
                            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-md animate-fadeIn animate-delay-400 h-full">
                                <div className="space-y-6 text-center">
                                    <div>
                                        <span className="text-xs tracking-wider uppercase text-neutral-400">
                                            El impostor era
                                        </span>
                                        {/* Avatar del impostor */}
                                        <div className="flex justify-center my-4">
                                            {state.players &&
                                                (() => {
                                                    const impostor = state.players.find(
                                                        (p) => p.uid === state.impostorId
                                                    );
                                                    return impostor ? (
                                                        <Avatar
                                                            photoURL={impostor.photoURL}
                                                            displayName={impostor.name}
                                                            size="lg"
                                                            className="ring-4 ring-orange-400/50 shadow-lg"
                                                        />
                                                    ) : null;
                                                })()}
                                        </div>
                                        <p className="font-serif text-2xl text-orange-400 mt-2">
                                            {state.impostorName}
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <span className="text-xs tracking-wider uppercase text-neutral-400">
                                            Palabra secreta
                                        </span>
                                        <p className="font-serif text-2xl text-white mt-2">
                                            {capitalize(state.secretWord)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha: Puntuación y botones */}
                        <div className="w-full max-w-sm mx-auto md:max-w-none flex flex-col">
                            <h2 className="text-3xl font-serif text-neutral-50 mb-5 text-center md:text-left">
                                Puntuación
                            </h2>

                            {/* Puntuación */}
                            <div className="bg-white/5 rounded-xl p-6 animate-fadeIn animate-delay-600 h-full">
                                <p className="text-neutral-400 text-xs tracking-wider uppercase mb-5 text-center md:text-left">
                                    {state.phase === "game_over"
                                        ? "Resto de jugadores"
                                        : "Puntuación parcial"}
                                </p>
                                <PlayerList
                                    players={state.players}
                                    currentUserId={user.uid}
                                    isHost={isHost}
                                    onCopyLink={onCopyLink}
                                    gameState={state}
                                    onVote={onVote}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botón o mensaje de espera - Fila completa debajo de las columnas */}
                    <div className="w-full max-w-sm md:max-w-2xl mx-auto mt-8">
                        {isHost ? (
                            <>
                                <div className="space-y-3 animate-fadeIn animate-delay-800">
                                    {/* Texto y botón visible solo en desktop */}
                                    <div className="hidden sm:block text-center">
                                        <p className="text-sm text-orange-400 animate-pulse mb-3">
                                            {state.phase === "game_over"
                                                ? "Lanza la siguiente partida para continuar"
                                                : "Lanza la siguiente ronda para continuar"}
                                        </p>
                                        <div className="max-w-xs mx-auto">
                                            <Button
                                                onClick={
                                                    state.phase === "game_over"
                                                        ? onPlayAgain
                                                        : onNextRound
                                                }
                                                variant="primary"
                                                size="md"
                                                className="w-full"
                                            >
                                                {state.phase === "game_over"
                                                    ? "Siguiente partida"
                                                    : "Siguiente ronda"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón fijo solo en mobile con overlay gradiente */}
                                <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40">
                                    <div className="h-10 bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-transparent"></div>
                                    <div className="bg-neutral-950 px-4 pb-6 pt-2">
                                        <div className="max-w-sm mx-auto">
                                            <Button
                                                onClick={
                                                    state.phase === "game_over"
                                                        ? onPlayAgain
                                                        : onNextRound
                                                }
                                                variant="primary"
                                                size="md"
                                                className="w-full shadow-lg"
                                            >
                                                {state.phase === "game_over"
                                                    ? "Siguiente partida"
                                                    : "Siguiente ronda"}
                                            </Button>
                                            <p className="text-center text-sm text-orange-400 animate-pulse mt-3">
                                                {state.phase === "game_over"
                                                    ? "Lanza la siguiente partida para continuar"
                                                    : "Lanza la siguiente ronda para continuar"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3 animate-fadeIn animate-delay-800">
                                <div className="text-center rounded-xl p-6 border border-orange-500/60 bg-neutral-900/50 backdrop-blur-sm">
                                    <p className="text-xl text-orange-400 animate-pulse mb-2">
                                        La siguiente partida empieza en breve
                                    </p>

                                    <p className="text-sm text-neutral-400">
                                        Espera a que el anfitrión{" "}
                                        <span className="font-semibold text-neutral-300">
                                            {state.players.find((p) => p.uid === state.hostId)
                                                ?.name || "desconocido"}
                                        </span>{" "}
                                        inicie la siguiente partida
                                        <span className="inline-flex ml-1">
                                            <span
                                                className="animate-bounce"
                                                style={{ animationDelay: "0ms" }}
                                            >
                                                .
                                            </span>
                                            <span
                                                className="animate-bounce"
                                                style={{ animationDelay: "150ms" }}
                                            >
                                                .
                                            </span>
                                            <span
                                                className="animate-bounce"
                                                style={{ animationDelay: "300ms" }}
                                            >
                                                .
                                            </span>
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fin del juego (Desactivado - Ahora GameOverScreen) */}
            {false && state.phase === "game_over" &&
                state.winner !== undefined &&
                (() => {
                    // Calcular ganadores - buscar entre TODOS los jugadores que tienen puntos, no solo los conectados
                    const isTie = state.winner === "Empate";
                    const playerScores = state.playerScores || {};
                    const maxScore = Math.max(...Object.values(playerScores));

                    // Crear lista de todos los jugadores (conectados + desconectados con puntos)
                    const allPlayerUids = new Set([
                        ...state.players.map((p) => p.uid),
                        ...Object.keys(playerScores),
                    ]);

                    const allPlayers = Array.from(allPlayerUids).map((uid) => {
                        const connectedPlayer = state.players.find((p) => p.uid === uid);
                        if (connectedPlayer) return connectedPlayer;
                        // Si no está conectado, buscar en formerPlayers
                        const formerPlayer = state.formerPlayers?.[uid];
                        return {
                            uid,
                            name: formerPlayer?.name || "Jugador desconectado",
                            photoURL: formerPlayer?.photoURL || null,
                        };
                    });

                    const winnerPlayers = allPlayers.filter(
                        (player) => (playerScores[player.uid] || 0) === maxScore
                    );
                    const winnerNames = winnerPlayers.map((p) => p.name).join(" y ");

                    return (
                        <div className="w-full max-w-sm mx-auto animate-fadeIn">
                            <div className="w-full px-4 py-6 space-y-6">
                                {/* Mensaje especial para partidas migradas */}
                                {state.migratedFromOldSystem && (
                                    <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 text-center animate-fadeIn">
                                        <p className="text-orange-300 text-sm">
                                            🔄 <strong>¡Hemos mejorado el juego!</strong>
                                        </p>
                                        <p className="text-neutral-300 text-sm mt-1">
                                            Tu partida anterior ha terminado por una actualización.
                                            <br />
                                            Inicia una nueva para probar las nuevas reglas.
                                        </p>
                                    </div>
                                )}
                                <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
                                    <h2 className="text-4xl font-serif text-neutral-50">
                                        {state.migratedFromOldSystem
                                            ? "Nueva versión disponible"
                                            : "Resultado final"}
                                    </h2>
                                </div>

                                {/* Caja de ganadores */}
                                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-md animate-fadeIn animate-delay-400">
                                    <div className="space-y-6 text-center">
                                        {winnerPlayers.length >= 3 ? (
                                            // Sin ganadores (empate triple o mayor)
                                            <div>
                                                <span className="text-xs tracking-wider uppercase text-neutral-400">
                                                    Resultado
                                                </span>
                                                <p className="font-serif text-2xl text-orange-400 mt-4">
                                                    No hay ganadores
                                                </p>
                                                <p className="text-lg text-neutral-300 mt-2">
                                                    ¡Empieza otro juego!
                                                </p>
                                            </div>
                                        ) : winnerPlayers.length === 2 ? (
                                            // Dos ganadores
                                            <div>
                                                <span className="text-xs tracking-wider uppercase text-white">
                                                    Ganadores
                                                </span>
                                                <div className="flex justify-center gap-6 my-4">
                                                    {winnerPlayers.map((winner) => (
                                                        <div
                                                            key={winner.uid}
                                                            className="flex flex-col items-center"
                                                        >
                                                            <Avatar
                                                                photoURL={winner.photoURL}
                                                                displayName={winner.name}
                                                                size="lg"
                                                                className="ring-4 ring-orange-400/50 shadow-lg"
                                                            />
                                                            <p className="font-serif text-lg text-orange-400 mt-2">
                                                                {winner.name}
                                                            </p>
                                                            <p className="text-sm text-neutral-400 mt-1">
                                                                {playerScores[winner.uid] || 0} pts
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : winnerPlayers.length === 1 ? (
                                            // Un ganador
                                            <div>
                                                <span className="text-xs tracking-wider uppercase text-white">
                                                    Ganador
                                                </span>
                                                <div className="flex justify-center my-4">
                                                    <Avatar
                                                        photoURL={winnerPlayers[0].photoURL}
                                                        displayName={winnerPlayers[0].name}
                                                        size="lg"
                                                        className="ring-4 ring-orange-400/50 shadow-lg"
                                                    />
                                                </div>
                                                <p className="font-serif text-2xl text-orange-400 mt-2">
                                                    {winnerPlayers[0].name}
                                                </p>
                                                <p className="text-lg text-neutral-400 mt-2">
                                                    {playerScores[winnerPlayers[0].uid] || 0} pts
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Puntuación final - solo mostrar si hay jugadores además de los ganadores */}
                                {allPlayers.filter(
                                    (p) => !winnerPlayers.some((w) => w.uid === p.uid)
                                ).length > 0 && (
                                        <div className="bg-white/5 rounded-xl p-4 animate-fadeIn animate-delay-400">
                                            <PlayerList
                                                players={allPlayers.filter(
                                                    (p) => !winnerPlayers.some((w) => w.uid === p.uid)
                                                )}
                                                currentUserId={user.uid}
                                                isHost={isHost}
                                                onCopyLink={onCopyLink}
                                                gameState={state}
                                                onVote={onVote}
                                            />
                                        </div>
                                    )}

                                <div className="animate-fadeIn animate-delay-600 flex flex-col items-center">
                                    <p className="text-xl font-medium text-white mb-4">
                                        ¿Quieres volver a jugar?
                                    </p>

                                    {isHost ? (
                                        <Button
                                            onClick={() => {
                                                console.log("🎮 Click en Nuevo Juego", {
                                                    gameId: state.gameId,
                                                    isHost,
                                                });
                                                onPlayAgain();
                                            }}
                                            variant="primary"
                                            size="md"
                                        >
                                            Empezar nuevo juego
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                                            <p className="text-neutral-400 text-sm leading-relaxed">
                                                Espera aquí a que el anfitrión comience un juego
                                                nuevo o, si prefieres, puedes{" "}
                                                <button
                                                    onClick={() => onLeaveGame()}
                                                    className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors cursor-pointer bg-transparent border-0 p-0 inline font-medium"
                                                >
                                                    abandonar la partida
                                                </button>{" "}
                                                para crear tu propio juego e invitar a tus amigos.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

            {/* Overlay de nueva ronda */}
            {showTurnOverlay && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm px-4 transition-opacity duration-300 ${isOverlayClosing ? "opacity-0" : "animate-fadeIn"}`}
                >
                    <div
                        className={`text-center space-y-8 max-w-md transition-all duration-300 ${isOverlayClosing ? "opacity-0 scale-95" : "animate-scaleIn"}`}
                    >
                        <h2 className="text-6xl font-serif text-orange-400">
                            Ronda {state.currentRound}
                        </h2>

                        {eliminatedPlayerInfo ? (
                            <div className="space-y-7">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar
                                        photoURL={eliminatedPlayerInfo.photoURL}
                                        displayName={eliminatedPlayerInfo.name}
                                        size="xl"
                                        className="ring-4 ring-red-500/50"
                                    />
                                    <p className="text-2xl text-neutral-300">
                                        <span className="text-red-400">
                                            {eliminatedPlayerInfo.name}
                                        </span>{" "}
                                        fue eliminado
                                    </p>
                                </div>
                                <p className="text-3xl text-neutral-200">
                                    El impostor sigue entre nosotros
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-7">
                                <p className="text-3xl text-neutral-200">Nadie ha sido eliminado</p>
                                <p className="text-2xl text-neutral-400">Nueva ronda de pistas</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <GameOverScreen
                state={state}
                isHost={isHost}
                onPlayAgain={onPlayAgain}
                user={user}
                onCopyLink={onCopyLink}
            />
            <RoundStartOverlay state={state} />

            {/* Modal de confirmación para terminar juego */}
            <Modal
                isOpen={showEndGameModal}
                onClose={() => setShowEndGameModal(false)}
                title="¿Finalizar juego?"
                size="sm"
            >
                <div className="text-center space-y-4">
                    <p className="text-neutral-400">
                        Esta acción finalizará el juego para todos los jugadores. ¿Estás seguro?
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => setShowEndGameModal(false)}
                            variant="outline"
                            size="md"
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                setShowEndGameModal(false);
                                onEndGame();
                            }}
                            variant="primary"
                            size="md"
                            className="flex-1"
                        >
                            Terminar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de confirmación para abandonar juego */}
            <Modal
                isOpen={showLeaveGameModal}
                onClose={() => setShowLeaveGameModal(false)}
                title="¿Abandonar juego?"
                size="sm"
            >
                <div className="text-center space-y-4">
                    <p className="text-neutral-400">
                        Saldrás del juego y volverás al lobby. ¿Estás seguro?
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => setShowLeaveGameModal(false)}
                            variant="outline"
                            size="md"
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                setShowLeaveGameModal(false);
                                onLeaveGame();
                            }}
                            variant="primary"
                            size="md"
                            className="flex-1"
                        >
                            Abandonar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
