import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { InvitationCard } from "../../components/InvitationCard";
import { useGameInvite } from "../../hooks/useGameInvite";
import { ROUTES } from "../../routes/routes";
import { GameNotFoundCard } from "../../components/InviteErrors";

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
            <GameNotFoundCard
                roomId={urlRoomId}
                onCancel={handleCancel}
                onCreate={() => {
                    const url = new URL(window.location);
                    url.searchParams.delete("roomId");
                    window.history.replaceState({}, "", url.toString());
                    emit("create-room", {});
                }}
            />
        );
    }

    // ============================================
    // Case: joinError from socket (e.g., game started while viewing)
    // ============================================
    if (joinError) {
        const handleJoinErrorCancel = () => {
            clearJoinError?.();
            clearPreview();
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());
            navigate(ROUTES.LOBBY);
        };

        if (/no existe/i.test(joinError)) {
            return (
                <GameNotFoundCard
                    roomId={urlRoomId}
                    onCancel={handleJoinErrorCancel}
                    onCreate={() => {
                        // Clear URL first so useSocket accepts the new room state redirect
                        const url = new URL(window.location);
                        url.searchParams.delete("roomId");
                        window.history.replaceState({}, "", url.toString());
                        emit("create-room", {});
                    }}
                />
            );
        }

        // Generic error
        return (
            <InvitationCard
                roomId={urlRoomId}
                title="No se pudo unir"
                subtitle={joinError}
                isError={true}
            >
                <Button onClick={handleJoinErrorCancel} variant="primary" className="w-full">
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
                    {isPlaying ? "Unirme" : "Unirme a la sala"}
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
