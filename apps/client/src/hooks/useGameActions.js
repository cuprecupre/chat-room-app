import { useCallback } from "react";

/**
 * Hook that provides all game-related actions
 * @param {Function} emit - Socket emit function
 * @param {Object} gameState - Current game state
 * @returns {Object} Game action functions
 */
export function useGameActions(emit, gameState) {
    const createRoom = useCallback(
        (options) => emit("create-room", options),
        [emit]
    );

    const joinRoom = useCallback(
        (roomId) => emit("join-room", roomId),
        [emit]
    );

    const updateOptions = useCallback(
        (options) => emit("update-options", { roomId: gameState?.roomId, options }),
        [emit, gameState?.roomId]
    );

    const startMatch = useCallback(
        (options) => emit("start-match", { roomId: gameState?.roomId, options }),
        [emit, gameState?.roomId]
    );

    const playAgain = useCallback(
        () => emit("play-again", gameState?.roomId),
        [emit, gameState?.roomId]
    );

    const nextRound = useCallback(
        () => emit("next-round", gameState?.roomId),
        [emit, gameState?.roomId]
    );

    const endMatch = useCallback(
        () => emit("return-to-lobby", gameState?.roomId),
        [emit, gameState?.roomId]
    );

    const leaveMatch = useCallback(() => {
        if (gameState?.roomId) {
            emit("leave-match", gameState.roomId);
        }
    }, [emit, gameState?.roomId]);

    const leaveRoom = useCallback(() => {
        if (gameState?.roomId) {
            // Remove roomId from URL immediately to prevent accidental reopen
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Emit leave event - server will send game-state: null
            // GameRouteHandler will then redirect to lobby automatically
            emit("leave-room", gameState.roomId);
        }
    }, [emit, gameState?.roomId]);

    const kickPlayer = useCallback(
        (targetId) => {
            if (gameState?.roomId && targetId) {
                emit("kick-player", { roomId: gameState.roomId, targetId });
            }
        },
        [emit, gameState?.roomId]
    );

    const castVote = useCallback(
        (targetId) => {
            if (!gameState?.roomId) return;
            // Send matchId if available, fallback to roomId
            emit("cast-vote", {
                roomId: gameState.roomId,
                matchId: gameState.matchId,
                targetId,
            });
        },
        [emit, gameState?.roomId, gameState?.matchId]
    );

    const submitClue = useCallback(
        (clue) => {
            if (!gameState?.roomId) return;
            emit("submit-clue", {
                roomId: gameState.roomId,
                clue,
            });
        },
        [emit, gameState?.roomId]
    );

    return {
        createRoom,
        joinRoom,
        updateOptions,
        startMatch,
        playAgain,
        endMatch,
        nextRound,
        leaveMatch,
        leaveRoom,
        kickPlayer,
        castVote,
        submitClue,
    };
}
