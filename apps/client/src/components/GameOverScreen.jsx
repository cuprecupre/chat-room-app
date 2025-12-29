import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { PlayerList } from "./game/PlayerList";
import { Modal } from "./ui/Modal";
import { Info } from "lucide-react";
import confetti from "canvas-confetti";

export function GameOverScreen({ state, isHost, onPlayAgain, user }) {
    const [showScoringModal, setShowScoringModal] = useState(false);

    // Confetti effect when game ends
    useEffect(() => {
        if (state.phase !== "game_over") return;

        // Burst from left
        confetti({
            particleCount: 100,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.6 },
            colors: ["#f97316", "#fb923c", "#fdba74", "#ffffff"],
        });
        // Burst from right
        confetti({
            particleCount: 100,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.6 },
            colors: ["#f97316", "#fb923c", "#fdba74", "#ffffff"],
        });
    }, [state.phase]);

    if (state.phase !== "game_over") return null;

    // Combinar jugadores conectados y desconectados que tienen puntos
    const playerScores = state.playerScores || {};
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

    const impostor = allPlayers.find((p) => p.uid === state.impostorId);

    // Determinar si ganó el impostor
    const impostorWon = state.winnerId === state.impostorId;

    // Título y subtítulo de ganador
    let winnerLabel, winnerTitle, winnerSubtitle;
    if (state.winner === "Empate") {
        winnerLabel = null;
        winnerTitle = "Los amigos ganan la partida";
        winnerSubtitle = "El impostor fue descubierto";
    } else if (impostorWon) {
        winnerLabel = null;
        winnerTitle = "El impostor gana la partida";
        winnerSubtitle = null;
    } else {
        winnerLabel = null;
        winnerTitle = "Los amigos ganan la partida";
        winnerSubtitle = "El impostor fue descubierto";
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-32 pt-10 px-4">
            {/* Ganador */}
            <div className="text-center mb-12">
                {winnerLabel && (
                    <p className="text-sm text-neutral-400 uppercase tracking-widest mb-2">
                        {winnerLabel}
                    </p>
                )}
                <h1 className="text-4xl md:text-6xl font-serif text-orange-400">{winnerTitle}</h1>
                {winnerSubtitle && (
                    <p className="text-xl md:text-2xl text-neutral-300 mt-6">{winnerSubtitle}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-12 items-start max-w-lg mx-auto pb-32">
                {/* Impostor Reveal */}
                <div className="w-full bg-neutral-900 rounded-2xl p-6 md:p-8 text-center">
                    <div className="grid grid-cols-2 gap-x-8 items-start relative">
                        {/* Impostor Column */}
                        <div className="flex flex-col items-center justify-center px-4">
                            <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                                El impostor era
                            </p>
                            {impostor ? (
                                <div className="flex items-center justify-center w-full">
                                    <span className="text-2xl text-white font-medium text-center break-words leading-tight max-w-full">
                                        {impostor.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-neutral-500">Desconocido</span>
                            )}
                        </div>

                        {/* Secret Word Column - Conditional */}
                        {state.secretWord && (
                            <>
                                {/* Vertical Divider */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>

                                <div className="flex flex-col items-center justify-center px-4">
                                    <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                                        Palabra secreta
                                    </p>
                                    <p className="text-2xl text-white font-medium capitalize">
                                        {state.secretWord}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="w-full">
                    <h2 className="text-2xl font-serif text-white mb-6 text-center">
                        Tabla de Posiciones
                    </h2>
                    <div className="rounded-2xl p-1">
                        <PlayerList
                            players={allPlayers}
                            currentUserId={user.uid}
                            isHost={isHost}
                            gameState={state}
                        />
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowScoringModal(true)}
                            className="mt-6 inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                        >
                            <Info className="w-5 h-5" />
                            ¿Cómo se calculan los puntos?
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de puntuación */}
            <Modal
                isOpen={showScoringModal}
                onClose={() => setShowScoringModal(false)}
                title="Sistema de Puntuación"
                size="lg"
            >
                <div className="space-y-8">
                    {/* Amigo */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-serif text-orange-400">Si eres Amigo</h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    Por cada ronda que votas al impostor
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium">
                                    +2 pts
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    <span className="text-yellow-400">★</span> Bonus (votas bien
                                    todas las rondas y el impostor pierde)
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium whitespace-nowrap">
                                    10 pts
                                </span>
                            </li>
                        </ul>
                    </div>

                    <hr className="border-white/10" />

                    {/* Impostor */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-serif text-orange-400">Si eres Impostor</h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    Por cada ronda que sobrevives
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium">
                                    +2 pts
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    <span className="text-yellow-400">★</span> Bonus (sobrevives las
                                    3 rondas)
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium whitespace-nowrap">
                                    10 pts
                                </span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        onClick={() => setShowScoringModal(false)}
                        variant="primary"
                        size="md"
                        className="w-full"
                    >
                        Entendido
                    </Button>
                </div>
            </Modal>

            {/* Botón Play Again (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 pt-16 pb-6 px-6 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent z-40">
                <div className="w-full max-w-2xl mx-auto space-y-4 flex flex-col items-center">
                    {isHost ? (
                        <>
                            <Button
                                onClick={onPlayAgain}
                                variant="primary"
                                size="lg"
                                className="w-full max-w-sm text-lg py-6"
                            >
                                Jugar otra partida
                            </Button>
                        </>
                    ) : (
                        <div className="bg-neutral-900 rounded-xl p-4 text-center w-fit">
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                <svg
                                    className="animate-spin h-4 w-4 text-orange-400 inline-block align-text-bottom mr-2"
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
                                Esperando a que <span className="text-orange-400 font-medium">
                                    {state.players.find((p) => p.uid === state.hostId)?.name ||
                                        "el anfitrión"}
                                </span> inicie una nueva partida
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
