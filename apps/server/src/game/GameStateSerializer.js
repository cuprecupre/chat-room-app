/**
 * GameStateSerializer
 *
 * Provides serialization functions for game state:
 * - getStateForPlayer: Personalized state for each player (for real-time updates)
 * - getEnrichedGameData: Full match data for persistence
 */

function getStateForPlayer(match, userId) {
    const player = match.players.find((p) => p.uid === userId);
    if (!player) return null;

    const eliminated = match.eliminatedPlayers || [];

    const baseState = {
        matchId: match.matchId,
        gameId: match.matchId, // For legacy client compatibility
        roomId: match.roomId,
        hostId: match.hostId,
        players: match.players,
        phase: match.phase,
        playerScores: match.playerScores,
        currentRound: match.currentRound,
        maxRounds: match.maxRounds,
        playerOrder: match.playerOrder,
        startingPlayerId: match.startingPlayerId,
    };

    if (match.phase === "playing") {
        const isInRound = match.roundPlayers.includes(userId);
        const isEliminated = eliminated.includes(userId);

        if (!isInRound && !isEliminated) {
            // Player never was part of this round (late joiner)
            baseState.phase = "lobby_wait";
        } else {
            // Player is active or eliminated - keep in playing phase
            baseState.role = match.impostorId === userId ? "impostor" : "friend";
            const isImpostor = match.impostorId === userId;
            baseState.secretWord = isImpostor ? "Descubre la palabra secreta" : match.secretWord;
            if (isImpostor && match.showImpostorHint) {
                baseState.secretCategory = match.secretCategory;
            }

            // Info de votación
            baseState.eliminatedPlayers = eliminated;
            baseState.hasVoted = match.votes.hasOwnProperty(userId);
            baseState.votedPlayers = Object.keys(match.votes);
            baseState.myVote = match.votes[userId] || null;
            baseState.activePlayers = match.roundPlayers.filter((uid) => !eliminated.includes(uid));
            baseState.canVote = !isEliminated;
            baseState.roundHistory = match.roundHistory;
        }
    } else if (match.phase === "round_result" || match.phase === "game_over") {
        const impostor = match.players.find((p) => p.uid === match.impostorId);
        const formerImpostor = match.formerPlayers[match.impostorId];
        baseState.impostorName = impostor
            ? impostor.name
            : formerImpostor
                ? formerImpostor.name
                : "Jugador desconectado";
        baseState.impostorId = match.impostorId;
        baseState.secretWord = match.secretWord;
        baseState.lastRoundScores = match.lastRoundScores;
        baseState.eliminatedPlayers = eliminated;
        baseState.formerPlayers = match.formerPlayers;
        baseState.playerBonus = match.playerBonus || {};
        baseState.roundHistory = match.roundHistory;

        if (match.phase === "game_over") {
            // Usar winnerId directamente (ya calculado en endRound)
            const winnerId = match.winnerId;
            const winner = match.players.find((p) => p.uid === winnerId);
            const formerWinner = match.formerPlayers[winnerId];
            baseState.winner = winner ? winner.name : formerWinner ? formerWinner.name : "Empate";
            baseState.winnerId = winnerId;
            baseState.impostorWon = winnerId === match.impostorId;
        }
    } else if (match.phase === "host_cancelled") {
        // Host left the match - no winner, no scores
        baseState.hostCancelled = true;
        baseState.winnerId = null;
        baseState.winner = null;
    }

    // Always include formerPlayers for showing scores
    baseState.formerPlayers = match.formerPlayers;

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
 * Returns enriched match data for full persistence in /matches collection.
 */
function getEnrichedGameData(match) {
    const playersInfo = match.players.map((p) => {
        const isImpostor = match.impostorId === p.uid;
        const eliminated = match.eliminatedPlayers || [];
        return {
            uid: p.uid,
            name: p.name,
            role: isImpostor ? "impostor" : "friend",
            score: match.playerScores[p.uid] || 0,
            wasEliminated: eliminated.includes(p.uid),
        };
    });

    // Determine winning team
    const impostorWon = match.winnerId === match.impostorId;
    const winningTeam = match.winnerId === null
        ? "cancelled"  // Match ended manually without a winner
        : match.winnerId === "tie"
            ? "tie"
            : impostorWon ? "impostor" : "friends";

    return {
        matchId: match.matchId,
        roomId: match.roomId,
        impostorId: match.impostorId,
        winnerId: match.winnerId || null,
        winningTeam,
        roundCount: match.currentRound,
        players: playersInfo,
        rounds: match.roundHistory || [],
        startedAt: match.startedAt || null,
        endedAt: Date.now(),
        options: match.options || {},
    };
}

module.exports = {
    getStateForPlayer,
    getEnrichedGameData,
};
