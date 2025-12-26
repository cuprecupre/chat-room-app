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
const { giveImpostorSurvivalPoints, giveImpostorMaxPoints, calculateRoundScores, findWinner } = require("./ScoringManager");
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

    let candidates = game.players.map(p => p.uid).filter((uid) => uid !== excludedPlayer);

    if (candidates.length === 0) {
        console.log(`[Game ${game.gameId}] No hay candidatos elegibles, permitiendo a todos`);
        candidates = game.players.map(p => p.uid);
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
    game.currentRound = 0;  // Se incrementará a 1 en startNextRound
    game.maxRounds = MAX_ROUNDS;
    game.eliminatedPlayers = [];
    game.votes = {};
    game.lastRoundScores = {};

    // Seleccionar impostor para toda la partida
    game.impostorId = selectImpostor(game);

    // Agregar al historial de impostores
    game.impostorHistory.unshift(game.impostorId);
    if (game.impostorHistory.length > 10) {
        game.impostorHistory = game.impostorHistory.slice(0, 10);
    }

    const impostorName = game.players.find((p) => p.uid === game.impostorId)?.name || "desconocido";
    console.log(
        `[Game ${game.gameId}] Nueva partida iniciada. Impostor: '${impostorName}' (${game.impostorId})`
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

    // Calcular jugador inicial
    game.startingPlayerId = calculateStartingPlayer(game);

    // Seleccionar nueva palabra
    const { word, category } = getRandomWordWithCategory();
    game.secretWord = word;
    game.secretCategory = category;

    console.log(
        `[Game ${game.gameId}] Ronda ${game.currentRound}/${game.maxRounds}: palabra='${game.secretWord}', categoría='${game.secretCategory}'`
    );

    game.phase = "playing";
    game.persist();
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

        console.log(`[Game ${game.gameId}] ¡Impostor descubierto! Ganador: ${winner}`);
    } else {
        // Impostor sobrevivió esta ronda
        giveImpostorSurvivalPoints(game);

        if (game.currentRound >= game.maxRounds) {
            // Impostor sobrevivió 3 rondas - gana
            game.winnerId = game.impostorId;
            game.phase = "game_over";
            console.log(`[Game ${game.gameId}] ¡Impostor sobrevivió 3 rondas! Gana.`);
        } else {
            // Continuar a la siguiente ronda
            game.phase = "round_result";
            console.log(`[Game ${game.gameId}] Ronda ${game.currentRound} terminada. Impostor sobrevive.`);
        }
    }

    game.persist();
}

/**
 * Manejar muerte súbita (solo quedan 2 jugadores)
 */
function handleSuddenDeath(game) {
    giveImpostorMaxPoints(game);
    game.winnerId = game.impostorId;
    game.phase = "game_over";

    console.log(`[Game ${game.gameId}] ¡Muerte súbita! Solo quedan 2 jugadores. Impostor gana.`);
    game.persist();
}

module.exports = {
    selectImpostor,
    startNewMatch,
    startNextRound,
    endRound,
    handleSuddenDeath,
    MAX_ROUNDS
};
