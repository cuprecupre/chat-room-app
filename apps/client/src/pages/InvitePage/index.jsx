import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useGameInvite } from "../../hooks/useGameInvite";
import bellImg from "../../assets/bell.png";
import { ROUTES } from "../../routes/routes";

export function InvitePage({ gameState, emit, joinGame, joinError, clearJoinError }) {
    const navigate = useNavigate();
    const { urlGameId, previewHostName, clearPreview } = useGameInvite(gameState);

    // If user joins a game successfully, redirect to game page
    useEffect(() => {
        if (gameState?.gameId && urlGameId === gameState.gameId) {
            navigate(ROUTES.GAME + `?gameId=${gameState.gameId}`);
        }
    }, [gameState?.gameId, urlGameId, navigate]);

    // Case 1: URL has a gameId but session is in another game → offer switch
    if (urlGameId && gameState?.gameId && urlGameId !== gameState.gameId) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                    <div className="flex justify-center">
                        <img
                            src={bellImg}
                            alt="Invitación"
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30 shadow-2xl animate-pulse-slow"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-neutral-50 mb-4">¡Te han invitado!</h2>
                        <p className="text-neutral-300 text-lg leading-relaxed">
                            Has recibido un enlace para unirte a la partida de{" "}
                            <span className="font-mono font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                                {previewHostName || urlGameId}
                            </span>
                            .
                            <br />
                            <span className="text-sm text-neutral-500 mt-2 block">
                                ¿Quieres abandonar tu partida actual para unirte?
                            </span>
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={() => joinGame(urlGameId)}
                            variant="primary"
                            size="lg"
                            className="w-full text-lg shadow-orange-900/20 shadow-lg"
                        >
                            Unirme a la partida
                        </Button>
                        <Button
                            onClick={() => {
                                const url = new URL(window.location);
                                url.searchParams.delete("gameId");
                                window.history.replaceState({}, "", url.toString());
                                navigate(ROUTES.GAME + `?gameId=${gameState.gameId}`);
                            }}
                            variant="ghost"
                            size="md"
                            className="w-full text-neutral-500 hover:text-neutral-300"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Case 2: URL has a gameId but session is not attached → allow joining or clearing
    if (urlGameId && !gameState?.gameId) {
        // Handle join errors
        if (joinError) {
            let errorTitle = "No se pudo unir";
            let errorMsg = joinError;

            if (/partida en curso/i.test(joinError)) {
                errorTitle = "Partida ya iniciada";
                errorMsg =
                    "Lo sentimos, esta partida ya comenzó y no acepta nuevos jugadores en este momento.";
            } else if (/no existe/i.test(joinError)) {
                errorTitle = "Enlace no válido";
                errorMsg =
                    "No encontramos esta partida. Es posible que el anfitrión la haya cerrado o el enlace sea incorrecto.";
            }

            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white animate-fadeIn">
                    <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <img
                                    src={bellImg}
                                    alt="Error"
                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-red-500/20 grayscale"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-neutral-900 rounded-full p-2 border border-neutral-800">
                                    <span className="text-2xl">🚫</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif text-neutral-50 mb-3">{errorTitle}</h2>
                            <p className="text-neutral-400 leading-relaxed">{errorMsg}</p>
                        </div>
                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={() => {
                                    clearJoinError();
                                    const url = new URL(window.location);
                                    url.searchParams.delete("gameId");
                                    window.history.replaceState({}, "", url.toString());
                                    clearPreview();
                                    navigate(ROUTES.LOBBY);
                                }}
                                variant="primary"
                                className="w-full"
                            >
                                Volver al inicio
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        // Invitation screen (no errors)
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                    <div className="flex justify-center">
                        <img
                            src={bellImg}
                            alt="Invitación"
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30 shadow-2xl animate-pulse-slow"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-neutral-50 mb-4">¡Te han invitado!</h2>
                        <p className="text-neutral-300 text-lg leading-relaxed">
                            Has recibido un enlace para unirte a la partida de{" "}
                            <span className="font-mono font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                                {previewHostName || urlGameId}
                            </span>
                            .
                            <br />
                            <span className="text-sm text-neutral-500 mt-2 block">
                                ¿Quieres entrar ahora?
                            </span>
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={() => joinGame(urlGameId)}
                            variant="primary"
                            size="lg"
                            className="w-full text-lg shadow-orange-900/20 shadow-lg"
                        >
                            Entrar a la partida
                        </Button>
                        <Button
                            onClick={() => {
                                navigate(ROUTES.LOBBY);
                            }}
                            variant="ghost"
                            size="md"
                            className="w-full text-neutral-500 hover:text-neutral-300"
                        >
                            Volver al inicio
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // No invite to show, redirect to lobby
    useEffect(() => {
        if (!urlGameId) {
            navigate(ROUTES.LOBBY);
        }
    }, [urlGameId, navigate]);

    return null;
}

