import React from "react";
import { Link, Share } from "lucide-react";
import { Button } from "../ui/Button";
import { PlayerList } from "./PlayerList";
import dualImpostorImg from "../../assets/dual-impostor.jpg";

export function LobbyScreen({
    state,
    isHost,
    user,
    onCopyLink,
    onStartGame,
    isMobile,
    onVote,
    onOpenInstructions,
}) {
    return (
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
                            className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2 !w-auto"
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
                            Espera a que se unan todos los jugadores...
                        </p>

                        <div className="w-full pt-2">
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
                        <p className="text-lg text-neutral-400 text-center">
                            <svg
                                className="animate-spin inline-block h-4 w-4 text-orange-400 mr-2 align-middle"
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
                                    : "Copiar enlace de la partida"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
