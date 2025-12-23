const { getRandomWordWithCategory } = require("../words");
const { calculateRoundScores, checkGameOver } = require("./ScoringManager");
const { calculateStartingPlayer } = require("./PlayerManager");

function selectImpostorWithLimit(game) {
    const lastTwoImpostors = game.impostorHistory.slice(0, 2);

    let excludedPlayer = null;
    if (lastTwoImpostors.length === 2 && lastTwoImpostors[0] === lastTwoImpostors[1]) {
        excludedPlayer = lastTwoImpostors[0];
        console.log(
            `[Game ${game.gameId}] Jugador ${game.players.find((p) => p.uid === excludedPlayer)?.name} fue impostor las últimas 2 veces, será excluido`
        );
    }

    let candidates = game.roundPlayers.filter((uid) => uid !== excludedPlayer);

    if (candidates.length === 0) {
        console.log(`[Game ${game.gameId}] No hay candidatos elegibles, permitiendo a todos`);
        candidates = [...game.roundPlayers];
    }

    // Fisher-Yates shuffle
    const shuffledCandidates = [...candidates];
    for (let i = shuffledCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCandidates[i], shuffledCandidates[j]] = [
            shuffledCandidates[j],
            shuffledCandidates[i],
        ];
    }

    return shuffledCandidates[0];
}

function startNewRound(game) {
    // Reiniciar estado de ronda
    game.roundPlayers = game.players.map((p) => p.uid);
    game.currentTurn = 1;
    game.eliminatedInRound = [];
    game.lastEliminatedInTurn = null;
    game.votes = {};
    game.turnHistory = [];
    game.lastRoundScores = {};
    game.roundCount++;

    // Calcular jugador inicial
    game.startingPlayerId = calculateStartingPlayer(game);

    // Seleccionar impostor
    game.impostorId = selectImpostorWithLimit(game);

    // Agregar al historial
    game.impostorHistory.unshift(game.impostorId);
    if (game.impostorHistory.length > 10) {
        game.impostorHistory = game.impostorHistory.slice(0, 10);
    }

    // Seleccionar palabra
    const { word, category } = getRandomWordWithCategory();
    game.secretWord = word;
    game.secretCategory = category;

    const impostorName = game.players.find((p) => p.uid === game.impostorId)?.name || "desconocido";
    console.log(
        `[Game ${game.gameId}] Ronda ${game.roundCount}: palabra='${game.secretWord}', categoría='${game.secretCategory}', impostor='${impostorName}' (${game.impostorId})`
    );
    console.log(
        `[Game ${game.gameId}] Historial de impostores:`,
        game.impostorHistory
            .slice(0, 3)
            .map((uid) => game.players.find((p) => p.uid === uid)?.name || uid)
    );

    game.phase = "playing";
}

function startNextTurn(game, wasTie = false) {
    console.log(
        `[Game ${game.gameId}] 🔄 startNextTurn llamado. Vuelta actual: ${game.currentTurn} → ${game.currentTurn + 1}`
    );
    console.log(
        `[Game ${game.gameId}] lastEliminatedInTurn antes de cambiar vuelta:`,
        game.lastEliminatedInTurn
    );
    console.log(`[Game ${game.gameId}] Fue empate:`, wasTie);

    game.currentTurn++;
    game.votes = {};

    if (game.currentTurn > 1 && !wasTie) {
        const previousTurn = game.currentTurn - 1;
        const points = previousTurn + 1;
        game.playerScores[game.impostorId] = (game.playerScores[game.impostorId] || 0) + points;
        game.lastRoundScores[game.impostorId] =
            (game.lastRoundScores[game.impostorId] || 0) + points;
        console.log(
            `[Game ${game.gameId}] Impostor sobrevivió vuelta ${previousTurn}: +${points} puntos`
        );
    } else if (wasTie) {
        console.log(`[Game ${game.gameId}] Empate: no se otorgan puntos al impostor`);
    }

    console.log(
        `[Game ${game.gameId}] ✅ Vuelta ${game.currentTurn} iniciada. lastEliminatedInTurn:`,
        game.lastEliminatedInTurn
    );

    // Persist after turn change (important for recovery)
    game.persist();
}

function endRound(game, friendsWon) {
    // Calcular puntos
    calculateRoundScores(game, friendsWon);

    // Verificar si alguien ganó
    const gameOver = checkGameOver(game);

    if (gameOver) {
        game.phase = "game_over";
        console.log(`[Game ${game.gameId}] ¡Partida terminada! Ganador: ${gameOver}`);
    } else {
        game.phase = "round_result";
        console.log(`[Game ${game.gameId}] Ronda ${game.roundCount} terminada.`);
    }

    // Persist after phase change (critical for recovery)
    game.persist();
}

module.exports = {
    selectImpostorWithLimit,
    startNewRound,
    startNextTurn,
    endRound,
};
