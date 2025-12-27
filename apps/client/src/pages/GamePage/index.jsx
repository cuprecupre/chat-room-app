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
    onMigrateGame,
    onLeaveGame,
    onVote,
}) {
    const { copyLink, copyGameCode, isMobile } = useCopyToClipboard();

    const isHost = useMemo(
        () => gameState && user && gameState.hostId === user.uid,
        [gameState, user]
    );

    const handleCopyLink = useCallback(() => {
        copyLink(gameState?.gameId);
    }, [copyLink, gameState?.gameId]);

    const handleCopyGameCode = useCallback(() => {
        copyGameCode(gameState?.gameId);
    }, [copyGameCode, gameState?.gameId]);

    return (
        <GameRoom
            state={gameState}
            isHost={isHost}
            user={user}
            onStartGame={onStartGame}
            onEndGame={onEndGame}
            onPlayAgain={onPlayAgain}
            onNextRound={onNextRound}
            onMigrateGame={onMigrateGame}
            onLeaveGame={onLeaveGame}
            onCopyLink={handleCopyLink}
            onCopyGameCode={handleCopyGameCode}
            onVote={onVote}
            isMobile={isMobile}
            onOpenInstructions={onOpenInstructions}
            showEndGameModal={false}
            onShowEndGameModal={() => { }}
        />
    );
}
