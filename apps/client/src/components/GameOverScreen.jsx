import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { PlayerList } from "./GameRoom";
import { Modal } from "./ui/Modal";
import { Info } from "lucide-react";

export function GameOverScreen({ state, isHost, onPlayAgain, user }) {
    const [showScoringModal, setShowScoringModal] = useState(false);
    if (state.phase !== "game_over") return null;

    const impostor = state.players.find((p) => p.uid === state.impostorId);

    // Determinar si ganó el impostor
    const impostorWon = state.winnerId === state.impostorId;

    // Título y subtítulo de ganador
    let winnerLabel, winnerTitle, winnerSubtitle;
    if (state.winner === "Empate") {
        winnerLabel = null;
        winnerTitle = "El impostor fue descubierto";
        winnerSubtitle = "Los amigos ganan";
    } else if (impostorWon) {
        winnerLabel = null;
        winnerTitle = "El impostor ganó la partida";
        winnerSubtitle = null;
    } else {
        winnerLabel = null;
        winnerTitle = "El impostor fue descubierto";
        winnerSubtitle = "Los amigos ganan";
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
                <h1 className="text-5xl md:text-6xl font-serif text-orange-400">{winnerTitle}</h1>
                {winnerSubtitle && (
                    <p className="text-3xl text-neutral-300 mt-2">{winnerSubtitle}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-12 items-start max-w-md mx-auto pb-32">
                {/* Impostor Reveal */}
                <div className="w-full">
                    <div className="bg-neutral-900 rounded-2xl p-8 text-center relative overflow-hidden">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 mb-6">
                            El impostor era
                        </p>

                        {impostor ? (
                            <>
                                <div className="flex items-center justify-center gap-4">
                                    <Avatar
                                        photoURL={impostor.photoURL}
                                        displayName={impostor.name}
                                        size="md"
                                        className="ring-2 ring-orange-500"
                                    />
                                    <span className="text-3xl font-serif text-white">
                                        {impostor.name}
                                    </span>
                                </div>
                                {state.secretWord && (
                                    <p className="text-base text-neutral-300 mt-4">
                                        Palabra secreta:{" "}
                                        <span className="text-white font-medium capitalize">
                                            {state.secretWord}
                                        </span>
                                    </p>
                                )}
                            </>
                        ) : (
                            <span className="text-neutral-500">Desconocido</span>
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
                            players={state.players}
                            currentUserId={user.uid}
                            isHost={isHost}
                            gameState={state}
                        />
                    </div>
                    <button
                        onClick={() => setShowScoringModal(true)}
                        className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-orange-400 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        ¿Cómo se calculan los puntos?
                    </button>
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
                                    <span className="text-yellow-400">★</span> Bonus (votas bien todas las rondas y el impostor pierde)
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
                                <span className="text-neutral-300">Por cada ronda que sobrevives</span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium">
                                    +2 pts
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    <span className="text-yellow-400">★</span> Bonus (sobrevives las 3 rondas)
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
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-neutral-950 z-40">
                <div className="max-w-sm mx-auto space-y-4">
                    {isHost ? (
                        <>
                            <Button
                                onClick={onPlayAgain}
                                variant="primary"
                                size="lg"
                                className="w-full text-lg py-6"
                            >
                                Siguiente Partida
                            </Button>
                        </>
                    ) : (
                        <div className="bg-neutral-900 rounded-xl p-4 text-center">
                            <p className="text-neutral-400 text-sm">
                                Esperando al anfitrión para la siguiente partida
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
                    )}
                </div>
            </div>
        </div>
    );
}
