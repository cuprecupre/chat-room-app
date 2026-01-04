import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { InvitationCard } from "../../components/InvitationCard";
import { useGameInvite } from "../../hooks/useGameInvite";
import { ROUTES } from "../../routes/routes";

/**
 * InvitePage - Invitation screen for AUTHENTICATED users
 * Handles: joining a new game, switching from another game, errors
 */
export function InvitePage({ gameState, emit, joinGame, joinError, clearJoinError }) {
    const navigate = useNavigate();
    const { urlRoomId, previewHostName, error, clearPreview } = useGameInvite(gameState);

    // If user joins a room successfully, redirect to game page
    useEffect(() => {
        if (gameState?.roomId && urlRoomId === gameState.roomId) {
            navigate(ROUTES.GAME + `?roomId=${gameState.roomId}`);
        }
    }, [gameState?.roomId, urlRoomId, navigate]);

    // No invite to show, redirect to lobby
    useEffect(() => {
        if (!urlRoomId) {
            navigate(ROUTES.LOBBY);
        }
    }, [urlRoomId, navigate]);

    // Handle cancel/go back
    const handleCancel = () => {
        clearJoinError?.();
        clearPreview();
        const url = new URL(window.location);
        url.searchParams.delete("roomId");
        window.history.replaceState({}, "", url.toString());

        // If in a room, go back to that room; otherwise go to lobby
        if (gameState?.roomId) {
            navigate(ROUTES.GAME + `?roomId=${gameState.roomId}`);
        } else {
            navigate(ROUTES.LOBBY);
        }
    };

    // ============================================
    // Case: Error from hook (NOT_FOUND or IN_PROGRESS from API)
    // ============================================
    if (error === "NOT_FOUND") {
        return (
            <InvitationCard
                roomId={urlRoomId}
                title="Enlace no válido"
                subtitle="No encontramos esta partida. Es posible que el anfitrión la haya cerrado o el enlace sea incorrecto."
                isError={true}
            >
                <Button onClick={handleCancel} variant="primary" className="w-full">
                    Volver al inicio
                </Button>
            </InvitationCard>
        );
    }

    if (error === "IN_PROGRESS") {
        return (
            <InvitationCard
                roomId={urlRoomId}
                title="Partida ya iniciada"
                subtitle="Lo sentimos, esta partida ya comenzó y no acepta nuevos jugadores en este momento."
                isError={true}
            >
                <Button onClick={handleCancel} variant="primary" className="w-full">
                    Volver al inicio
                </Button>
            </InvitationCard>
        );
    }

    // ============================================
    // Case: joinError from socket (e.g., game started while viewing)
    // ============================================
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
            <InvitationCard
                roomId={urlRoomId}
                title={errorTitle}
                subtitle={errorMsg}
                isError={true}
            >
                <Button
                    onClick={() => {
                        clearJoinError();
                        clearPreview();
                        const url = new URL(window.location);
                        url.searchParams.delete("roomId");
                        window.history.replaceState({}, "", url.toString());
                        navigate(ROUTES.LOBBY);
                    }}
                    variant="primary"
                    className="w-full"
                >
                    Volver al inicio
                </Button>
            </InvitationCard>
        );
    }

    // ============================================
    // Case: User is in ANOTHER room (lobby or playing)
    // ============================================
    if (urlRoomId && gameState?.roomId && urlRoomId !== gameState.roomId) {
        const isPlaying = gameState.phase === "playing";

        return (
            <InvitationCard
                hostName={previewHostName}
                roomId={urlRoomId}
                title="¡Te han invitado!"
                subtitle={
                    isPlaying
                        ? "Estás en una partida en curso. Si te unes, la abandonarás."
                        : ""
                }
            >
                <Button
                    onClick={() => joinGame(urlRoomId)}
                    variant="primary"
                    size="lg"
                    className="w-full text-lg shadow-orange-900/20 shadow-lg"
                >
                    {isPlaying ? "Abandonar y Unirme" : "Unirme a la sala"}
                </Button>
                <Button
                    onClick={handleCancel}
                    variant="ghost"
                    size="md"
                    className="w-full text-neutral-500 hover:text-neutral-300"
                >
                    {isPlaying ? "Volver a mi sala" : "Cancelar"}
                </Button>
            </InvitationCard>
        );
    }

    // ============================================
    // Case: Normal invitation (user has no active room)
    // ============================================
    if (urlRoomId && !gameState?.roomId) {
        return (
            <InvitationCard
                hostName={previewHostName}
                roomId={urlRoomId}
                title="¡Te han invitado!"
                subtitle="¿Quieres entrar ahora?"
            >
                <Button
                    onClick={() => joinGame(urlRoomId)}
                    variant="primary"
                    size="lg"
                    className="w-full text-lg shadow-orange-900/20 shadow-lg"
                >
                    Entrar a la sala
                </Button>
                <Button
                    onClick={handleCancel}
                    variant="ghost"
                    size="md"
                    className="w-full text-neutral-500 hover:text-neutral-300"
                >
                    Volver al inicio
                </Button>
            </InvitationCard>
        );
    }

    // Fallback - should not reach here
    return null;
}
