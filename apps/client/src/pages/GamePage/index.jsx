import { useCallback, useMemo } from "react";
import { GameRoom } from "../../components/GameRoom";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";

export function GamePage({
    gameState,
    user,
    emit,
    onOpenInstructions,
    onStartGame,
    onEndGame,
    onPlayAgain,
    onNextRound,
    onLeaveRoom,
    onLeaveMatch,
    onUpdateOptions,
    onVote,
}) {
    const { copyLink, copyGameCode, isMobile } = useCopyToClipboard();

    const isHost = useMemo(
        () => gameState && user && gameState.hostId === user.uid,
        [gameState, user]
    );

    const handleCopyLink = useCallback(() => {
        copyLink(gameState?.roomId);
    }, [copyLink, gameState?.roomId]);

    const handleCopyCode = useCallback(() => {
        copyGameCode(gameState?.roomId);
    }, [copyGameCode, gameState?.roomId]);

    return (
        <GameRoom
            state={gameState}
            isHost={isHost}
            user={user}
            onStartGame={onStartGame}
            onEndGame={onEndGame}
            onPlayAgain={onPlayAgain}
            onNextRound={onNextRound}
            onLeaveRoom={onLeaveRoom}
            onLeaveMatch={onLeaveMatch}
            onUpdateOptions={onUpdateOptions}
            onCopyLink={handleCopyLink}
            onCopyGameCode={handleCopyCode}
            onVote={onVote}
            isMobile={isMobile}
            onOpenInstructions={onOpenInstructions}
            showEndGameModal={false}
            onShowEndGameModal={() => { }}
        />
    );
}
