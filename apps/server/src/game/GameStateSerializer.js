/**
 * GameStateSerializer
 *
 * Provides serialization functions for game state:
 * - getStateForPlayer: Personalized state for each player (for real-time updates)
 * - getAnalyticsState: Minimal data for end-of-game analytics
 */

function getStateForPlayer(game, userId) {
    const player = game.players.find((p) => p.uid === userId);
    if (!player) return null;

    const eliminated = game.eliminatedPlayers || [];

    const baseState = {
        gameId: game.gameId,
        hostId: game.hostId,
        players: game.players,
        phase: game.phase,
        playerScores: game.playerScores,
        currentRound: game.currentRound,
        maxRounds: game.maxRounds,
        playerOrder: game.playerOrder,
        startingPlayerId: game.startingPlayerId,
    };

    if (game.phase === "playing") {
        const isInRound = game.roundPlayers.includes(userId);
        const isEliminated = eliminated.includes(userId);

        if (!isInRound && !isEliminated) {
            // Player never was part of this round (late joiner)
            baseState.phase = "lobby_wait";
        } else {
            // Player is active or eliminated - keep in playing phase
            baseState.role = game.impostorId === userId ? "impostor" : "amigo";
            const isImpostor = game.impostorId === userId;
            baseState.secretWord = isImpostor ? "Descubre la palabra secreta" : game.secretWord;
            if (isImpostor && game.showImpostorHint) {
                baseState.secretCategory = game.secretCategory;
            }

            // Info de votación
            baseState.eliminatedPlayers = eliminated;
            baseState.hasVoted = game.votes.hasOwnProperty(userId);
            baseState.votedPlayers = Object.keys(game.votes);
            baseState.myVote = game.votes[userId] || null;
            baseState.activePlayers = game.roundPlayers.filter((uid) => !eliminated.includes(uid));
            baseState.canVote = !isEliminated;
            baseState.roundHistory = game.roundHistory;
        }
    } else if (game.phase === "round_result" || game.phase === "game_over") {
        const impostor = game.players.find((p) => p.uid === game.impostorId);
        const formerImpostor = game.formerPlayers[game.impostorId];
        baseState.impostorName = impostor
            ? impostor.name
            : formerImpostor
              ? formerImpostor.name
              : "Jugador desconectado";
        baseState.impostorId = game.impostorId;
        baseState.secretWord = game.secretWord;
        baseState.lastRoundScores = game.lastRoundScores;
        baseState.eliminatedPlayers = eliminated;
        baseState.formerPlayers = game.formerPlayers;
        baseState.playerBonus = game.playerBonus || {};
        baseState.roundHistory = game.roundHistory;

        if (game.phase === "game_over") {
            // Usar winnerId directamente (ya calculado en endRound)
            const winnerId = game.winnerId;
            const winner = game.players.find((p) => p.uid === winnerId);
            const formerWinner = game.formerPlayers[winnerId];
            baseState.winner = winner ? winner.name : formerWinner ? formerWinner.name : "Empate";
            baseState.winnerId = winnerId;
            baseState.impostorWon = winnerId === game.impostorId;
            baseState.migratedFromOldSystem = game.migratedFromOldSystem || false;
        }
    }

    // Always include formerPlayers for showing scores
    baseState.formerPlayers = game.formerPlayers;

    // DIAGNOSTIC: Detect bloated state
    try {
        const jsonStr = JSON.stringify(baseState);
        if (jsonStr.length > 50000) {
            console.warn(
                `[GameStateSerializer] ⚠️ LARGE STATE DETECTED: ${(jsonStr.length / 1024).toFixed(2)} KB`
            );
        }
    } catch (e) {
        console.error("[GameStateSerializer] Error analyzing state size:", e);
    }

    return baseState;
}

/**
 * Returns minimal analytics data for completed games.
 * Used for end-of-game persistence to game_analytics collection.
 */
function getAnalyticsState(game) {
    return {
        gameId: game.gameId,
        hostId: game.hostId,
        winnerId: game.winnerId || null,
        players: game.players.map((p) => ({ uid: p.uid, name: p.name })),
        playerScores: game.playerScores,
        currentRound: game.currentRound,
        maxRounds: game.maxRounds,
        completedAt: new Date().toISOString(),
        endReason: "completed",
    };
}

module.exports = {
    getStateForPlayer,
    getAnalyticsState,
};
