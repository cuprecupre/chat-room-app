/**
 * RoundManager - Nueva Versión
 *
 * Estructura simplificada:
 * - 1 partida = máximo 3 rondas
 * - Mismo impostor durante toda la partida
 * - Cada ronda es una sola votación
 * - El impostor se selecciona solo al inicio de la partida
 */

const { getRandomWordWithCategory } = require("../words");
const {
    giveImpostorSurvivalPoints,
    giveImpostorMaxPoints,
    calculateRoundScores,
    findWinner,
} = require("./ScoringManager");
const { calculateStartingPlayer } = require("./PlayerManager");

const MAX_ROUNDS = 3;

/**
 * Seleccionar impostor (solo al inicio de la partida)
 * Mantiene historial para evitar que el mismo sea impostor en partidas consecutivas
 */
function selectImpostor(game) {
    const lastTwoImpostors = game.impostorHistory.slice(0, 2);

    let excludedPlayer = null;
    if (lastTwoImpostors.length === 2 && lastTwoImpostors[0] === lastTwoImpostors[1]) {
        excludedPlayer = lastTwoImpostors[0];
        console.log(
            `[Game ${game.gameId}] Jugador ${game.players.find((p) => p.uid === excludedPlayer)?.name} fue impostor las últimas 2 partidas, será excluido`
        );
    }

    let candidates = game.players.map((p) => p.uid).filter((uid) => uid !== excludedPlayer);

    if (candidates.length === 0) {
        console.log(`[Game ${game.gameId}] No hay candidatos elegibles, permitiendo a todos`);
        candidates = game.players.map((p) => p.uid);
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

/**
 * Iniciar nueva partida (nueva palabra, nuevo impostor)
 * Se llama al inicio del juego o cuando el host da a "Nueva partida"
 */
function startNewMatch(game) {
    // Reset completo de puntos
    game.playerScores = {};
    game.players.forEach((p) => {
        game.playerScores[p.uid] = 0;
    });

    // Inicializar estado de partida
    game.currentRound = 0; // Se incrementará a 1 en startNextRound
    game.maxRounds = MAX_ROUNDS;
    game.eliminatedPlayers = [];
    game.votes = {};
    game.lastRoundScores = {};
    game.playerBonus = {};
    game.correctVotesPerPlayer = {};

    // Seleccionar impostor para toda la partida
    game.impostorId = selectImpostor(game);

    // Agregar al historial de impostores
    game.impostorHistory.unshift(game.impostorId);
    if (game.impostorHistory.length > 10) {
        game.impostorHistory = game.impostorHistory.slice(0, 10);
    }

    // Seleccionar palabra para toda la partida (NO cambia entre rondas)
    const { word, category } = getRandomWordWithCategory();
    game.secretWord = word;
    game.secretCategory = category;

    // Calcular jugador inicial UNA VEZ para toda la partida
    // (roundPlayers debe estar configurado antes de calcular)
    game.roundPlayers = game.players.map((p) => p.uid);

    // Guardar el lastStartingPlayerId ANTES de actualizarlo (para restaurar en caso de muerte súbita)
    game.previousLastStartingPlayerId = game.lastStartingPlayerId;

    game.startingPlayerId = calculateStartingPlayer(game);
    game.lastStartingPlayerId = game.startingPlayerId;

    // Guardar el jugador inicial ORIGINAL (para detectar si fue reemplazado)
    game.originalStartingPlayerId = game.startingPlayerId;

    const impostorName = game.players.find((p) => p.uid === game.impostorId)?.name || "desconocido";
    const startingName = game.players.find((p) => p.uid === game.startingPlayerId)?.name || "desconocido";
    console.log(
        `[Game ${game.gameId}] Nueva partida iniciada. Impostor: '${impostorName}', Inicia: '${startingName}', Palabra: '${word}'`
    );

    // Iniciar la primera ronda
    startNextRound(game);
}

/**
 * Iniciar siguiente ronda (nueva palabra, mismo impostor)
 */
function startNextRound(game) {
    game.currentRound++;
    game.votes = {};
    game.lastRoundScores = {};

    // Jugadores activos para esta ronda (excluyendo eliminados)
    game.roundPlayers = game.players
        .map((p) => p.uid)
        .filter((uid) => !game.eliminatedPlayers.includes(uid));

    // CRITICAL: Verificar muerte súbita ANTES de iniciar ronda
    // Si solo quedan 2 jugadores (impostor + 1 amigo), el impostor gana automáticamente
    if (game.roundPlayers.length <= 2) {
        console.log(
            `[Game ${game.gameId}] ¡Muerte súbita detectada! Solo ${game.roundPlayers.length} jugadores. Impostor gana.`
        );
        handleSuddenDeath(game);
        return; // NO iniciar la ronda
    }

    // Solo recalcular jugador inicial si el actual fue eliminado
    // El mismo jugador debe iniciar TODAS las rondas de una partida
    if (!game.roundPlayers.includes(game.startingPlayerId)) {
        const oldStartingPlayer = game.startingPlayerId;
        game.startingPlayerId = calculateStartingPlayer(game);
        // Actualizar lastStartingPlayerId para que la siguiente partida rote desde el reemplazo
        // Ej: Si A fue eliminado y B lo reemplaza, la siguiente partida empezará con C
        game.lastStartingPlayerId = game.startingPlayerId;
        const oldName = game.formerPlayers[oldStartingPlayer]?.name || oldStartingPlayer;
        const newName = game.players.find((p) => p.uid === game.startingPlayerId)?.name || "desconocido";
        console.log(
            `[Game ${game.gameId}] Jugador inicial '${oldName}' fue eliminado. Nuevo: '${newName}' (rotación actualizada)`
        );
    }

    // La palabra ya fue seleccionada en startNewMatch, no cambia entre rondas
    const startingName = game.players.find((p) => p.uid === game.startingPlayerId)?.name || "desconocido";
    console.log(
        `[Game ${game.gameId}] Ronda ${game.currentRound}/${game.maxRounds}: palabra='${game.secretWord}', inicia='${startingName}'`
    );

    game.phase = "playing";
}

/**
 * Finalizar ronda
 * @param {Object} game - Estado del juego
 * @param {boolean} impostorCaught - Si el impostor fue descubierto
 */
function endRound(game, impostorCaught) {
    if (impostorCaught) {
        // Amigos ganan - calcular puntos y terminar partida
        calculateRoundScores(game, true);

        // Encontrar al amigo ganador (el que tiene más puntos)
        const winner = findWinner(game);
        game.winnerId = winner;
        game.phase = "game_over";
        game.persistAnalytics("impostor_caught");

        console.log(`[Game ${game.gameId}] ¡Impostor descubierto! Ganador: ${winner}`);
    } else {
        // Impostor sobrevivió esta ronda
        giveImpostorSurvivalPoints(game);

        if (game.currentRound >= game.maxRounds) {
            // Impostor sobrevivió 3 rondas - gana
            giveImpostorMaxPoints(game);
            game.winnerId = game.impostorId;
            game.phase = "game_over";
            game.persistAnalytics("impostor_survived");
            console.log(`[Game ${game.gameId}] ¡Impostor sobrevivió 3 rondas! Gana.`);
        } else {
            // Continuar a la siguiente ronda
            game.phase = "round_result";
            console.log(
                `[Game ${game.gameId}] Ronda ${game.currentRound} terminada. Impostor sobrevive.`
            );
        }
    }
}

/**
 * Manejar muerte súbita (solo quedan 2 jugadores)
 */
function handleSuddenDeath(game) {
    giveImpostorMaxPoints(game);
    game.winnerId = game.impostorId;
    game.phase = "game_over";

    console.log(
        `[Game ${game.gameId}] Muerte súbita: rotación normal`
    );

    game.persistAnalytics("sudden_death");
    console.log(`[Game ${game.gameId}] ¡Muerte súbita! Solo quedan 2 jugadores. Impostor gana.`);
}

module.exports = {
    selectImpostor,
    startNewMatch,
    startNextRound,
    endRound,
    handleSuddenDeath,
    MAX_ROUNDS,
};
