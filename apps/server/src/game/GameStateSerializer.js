const { checkGameOver } = require("./ScoringManager");

function getPersistenceState(game) {
    return {
        hostId: game.hostId,
        phase: game.phase,
        players: game.players,
        playerScores: game.playerScores,

        // Game Config
        showImpostorHint: game.showImpostorHint,
        maxRounds: game.maxRounds,
        targetScore: game.targetScore,
        initialPlayerCount: game.initialPlayerCount,

        // Round State
        roundCount: game.roundCount,
        secretWord: game.secretWord,
        secretCategory: game.secretCategory,
        impostorId: game.impostorId,
        startingPlayerId: game.startingPlayerId,
        currentTurn: game.currentTurn,

        // Arrays & Objects
        roundPlayers: game.roundPlayers,
        eliminatedInRound: game.eliminatedInRound,
        votes: game.votes,
        turnHistory: game.turnHistory,
        lastRoundScores: game.lastRoundScores,
        playerOrder: game.playerOrder,
        impostorHistory: game.impostorHistory,
        formerPlayers: game.formerPlayers,
    };
}

function getStateForPlayer(game, userId) {
    const player = game.players.find((p) => p.uid === userId);
    if (!player) return null;

    const baseState = {
        gameId: game.gameId,
        hostId: game.hostId,
        players: game.players,
        phase: game.phase,
        playerScores: game.playerScores,
        roundCount: game.roundCount,
        maxRounds: game.maxRounds,
        targetScore: game.targetScore,
        playerOrder: game.playerOrder,
        startingPlayerId: game.startingPlayerId,
    };

    if (game.phase === "playing") {
        const isInRound = game.roundPlayers.includes(userId);
        if (!isInRound) {
            baseState.phase = "lobby_wait";
        } else {
            baseState.role = game.impostorId === userId ? "impostor" : "amigo";
            const isImpostor = game.impostorId === userId;
            baseState.secretWord = isImpostor ? "Descubre la palabra secreta" : game.secretWord;
            if (isImpostor && game.showImpostorHint) {
                baseState.secretCategory = game.secretCategory;
            }

            // Info de votación
            baseState.currentTurn = game.currentTurn;
            baseState.maxTurns = game.maxTurns;
            baseState.eliminatedInRound = game.eliminatedInRound;
            baseState.lastEliminatedInTurn = game.lastEliminatedInTurn;
            baseState.hasVoted = game.votes.hasOwnProperty(userId);
            baseState.votedPlayers = Object.keys(game.votes);
            baseState.myVote = game.votes[userId] || null;
            baseState.activePlayers = game.roundPlayers.filter(
                (uid) => !game.eliminatedInRound.includes(uid)
            );
            baseState.canVote = !game.eliminatedInRound.includes(userId);
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
        baseState.eliminatedInRound = game.eliminatedInRound;
        baseState.formerPlayers = game.formerPlayers;

        if (game.phase === "game_over") {
            const winnerId = checkGameOver(game);
            const winner = game.players.find((p) => p.uid === winnerId);
            const formerWinner = game.formerPlayers[winnerId];
            baseState.winner = winner ? winner.name : formerWinner ? formerWinner.name : "Empate";
            baseState.winnerId = winnerId;
        }
    }

    // Always include formerPlayers for showing scores
    baseState.formerPlayers = game.formerPlayers;

    return baseState;
}

module.exports = {
    getPersistenceState,
    getStateForPlayer,
};
