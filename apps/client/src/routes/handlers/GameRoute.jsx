import { Navigate } from "react-router-dom";
import { useRoomIdFromUrl } from "../../hooks/useRoomIdFromUrl";
import { ROUTES } from "../routes.jsx";
import { GamePage } from "../../pages/GamePage";
import { InvitePage } from "../../pages/InvitePage";

/**
 * Game route handler - shows game, invite page, or redirects based on state
 */
export function GameRoute({
    gameState,
    user,
    emit,
    joinGame,
    joinError,
    clearJoinError,
    onOpenInstructions,
    onStartGame,
    onUpdateOptions,
    onPlayAgain,
    onEndMatch,
    onNextRound,
    onLeaveRoom,
    onLeaveMatch,
    onVote,
    onSubmitClue,
    onKickPlayer,
}) {
    const urlRoomId = useRoomIdFromUrl();

    // If there's a URL room ID but user is not in that room, show invite page
    if (urlRoomId && (!gameState?.roomId || urlRoomId !== gameState.roomId)) {
        return (
            <InvitePage
                gameState={gameState}
                emit={emit}
                joinGame={joinGame}
                joinError={joinError}
                clearJoinError={clearJoinError}
            />
        );
    }

    // If user is in a room, show game page
    if (gameState?.roomId) {
        return (
            <GamePage
                gameState={gameState}
                user={user}
                emit={emit}
                onOpenInstructions={onOpenInstructions}
                onStartGame={onStartGame}
                onUpdateOptions={onUpdateOptions}
                onPlayAgain={onPlayAgain}
                onEndMatch={onEndMatch}
                onNextRound={onNextRound}
                onLeaveRoom={onLeaveRoom}
                onLeaveMatch={onLeaveMatch}
                onVote={onVote}
                onSubmitClue={onSubmitClue}
                onKickPlayer={onKickPlayer}
            />
        );
    }

    // Otherwise redirect to lobby
    return <Navigate to={ROUTES.LOBBY} replace />;
}
