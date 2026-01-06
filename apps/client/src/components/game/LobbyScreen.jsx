import React, { useState, useEffect } from "react";
import { Link, Share, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { PlayerList } from "./PlayerList";

// Firebase Storage CDN URL
const dualImpostorImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fdual-impostor.jpg?alt=media";

export function LobbyScreen({
    state,
    isHost,
    user,
    onCopyLink,
    onStartGame,
    onUpdateOptions,
    isMobile,
    onVote,
    onOpenInstructions,
    onKickPlayer,
}) {
    const [showImpostorHint, setShowImpostorHint] = useState(
        state.options?.showImpostorHint !== undefined ? state.options.showImpostorHint : true
    );

    // Sync state when room options change (e.g. from server)
    useEffect(() => {
        if (state.options?.showImpostorHint !== undefined) {
            setShowImpostorHint(state.options.showImpostorHint);
        }
    }, [state.options?.showImpostorHint]);

    const handleToggleHint = () => {
        const newValue = !showImpostorHint;
        setShowImpostorHint(newValue);
        if (onUpdateOptions) {
            onUpdateOptions({ showImpostorHint: newValue });
        }
    };

    const handleStartGame = () => {
        onStartGame({ showImpostorHint });
    };
    const host = state.players?.find((p) => p.uid === state.hostId);
    let hostName = host ? host.name.toUpperCase() : "EL ANFITRIÓN";

    // Robustness: if I am the host, use my name directly
    if (isHost && user?.name) {
        hostName = user.name.toUpperCase();
    }

    return (
        <div className="w-full max-w-sm mx-auto text-center space-y-4 pb-32 pt-10 px-0">
            {/* Room Identifier Badge */}
            <div className="flex items-center justify-center mb-6 animate-fadeIn">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 rounded-full">
                    SALA DE {hostName}
                </span>
            </div>

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
                            className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2 !w-auto"
                        >
                            {isMobile ? (
                                <Share className="w-4 h-4" />
                            ) : (
                                <Link className="w-4 h-4" />
                            )}
                            {isMobile
                                ? "Compartir invitación"
                                : "Copiar enlace de la sala"}
                        </Button>

                        <p className="text-sm text-neutral-400 font-regular animate-pulse max-w-[280px] mx-auto">
                            Comparte el enlace y espera hasta que se unan para iniciar la partida
                        </p>

                        <div className="w-full pt-2">
                            {/* Opciones de juego (solo para el host antes de empezar) */}
                            <div className="bg-white/5 rounded-md p-4 font-sans mb-4">
                                <label className="flex items-center justify-between cursor-pointer gap-4">
                                    <div className="flex-1 text-left">
                                        <span className="text-sm font-semibold text-neutral-300">
                                            Jugar en modo fácil
                                        </span>
                                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                            El Impostor recibirá una pequeña ayuda sobre la palabra
                                            secreta.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleHint}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-neutral-950 ${showImpostorHint ? "bg-green-500" : "bg-neutral-700"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${showImpostorHint ? "translate-x-6" : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </label>
                            </div>

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

                        {/* Botón fijo en mobile, normal en desktop */}
                        <div className="hidden sm:block">
                            <Button
                                onClick={handleStartGame}
                                disabled={state.players.length < 2}
                                variant="primary"
                                size="md"
                                className="w-full"
                            >
                                Comenzar partida
                            </Button>
                        </div>
                    </div>

                    {/* Botón fijo solo en mobile con overlay gradiente premium (como Siguiente partida) */}
                    <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40">
                        <div className="h-10 bg-gradient-to-t from-neutral-950/80 via-neutral-950/40 to-transparent"></div>
                        <div className="bg-neutral-950 px-4 pb-8">
                            <div className="max-w-sm mx-auto">
                                <Button
                                    onClick={handleStartGame}
                                    disabled={state.players.length < 2}
                                    variant="primary"
                                    size="md"
                                    className="w-full shadow-lg"
                                >
                                    Comenzar partida
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
                        <p className="text-sm text-neutral-400 text-center">
                            <svg
                                className="animate-spin inline-block h-3 w-3 text-orange-400 mr-2 align-middle"
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
                            </span> inicie la partida
                        </p>

                        <div className="w-full">
                            {state.options?.showImpostorHint && (
                                <div className="mb-4 flex items-center justify-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} />
                                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-green-500/80">
                                        Modo fácil activado
                                    </span>
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
                                className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2 !w-auto"
                            >
                                {isMobile ? (
                                    <Share className="w-4 h-4" />
                                ) : (
                                    <Link className="w-4 h-4" />
                                )}
                                {isMobile
                                    ? "Compartir invitación"
                                    : "Copiar enlace de la sala"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
