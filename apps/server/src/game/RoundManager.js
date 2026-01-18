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
 * Seleccionar impostor (solo al inicio del match)
 * Mantiene historial para evitar que el mismo sea impostor en partidas consecutivas
 */
function selectImpostor(match) {
    const lastTwoImpostors = match.impostorHistory.slice(0, 2);

    let excludedPlayer = null;
    if (lastTwoImpostors.length === 2 && lastTwoImpostors[0] === lastTwoImpostors[1]) {
        excludedPlayer = lastTwoImpostors[0];
    }

    let candidates = match.players.map((p) => p.uid).filter((uid) => uid !== excludedPlayer);

    if (candidates.length === 0) {
        candidates = match.players.map((p) => p.uid);
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
 * Iniciar nuevo match (nueva palabra, nuevo impostor)
 * Se llama al inicio del juego o cuando el host da a "Nuevo match"
 */
function startNewMatch(match) {
    // Reset completo de puntos
    match.playerScores = {};
    match.players.forEach((p) => {
        match.playerScores[p.uid] = 0;
    });

    // Inicializar estado de match
    match.currentRound = 0; // Se incrementará a 1 en startNextRound
    match.maxRounds = MAX_ROUNDS;
    match.eliminatedPlayers = [];
    match.votes = {};
    match.lastRoundScores = {};
    match.playerBonus = {};
    match.correctVotesPerPlayer = {};

    // Seleccionar impostor para todo el match
    match.impostorId = selectImpostor(match);

    // Agregar al historial de impostores
    match.impostorHistory.unshift(match.impostorId);
    if (match.impostorHistory.length > 10) {
        match.impostorHistory = match.impostorHistory.slice(0, 10);
    }

    // Seleccionar palabra para todo el match (NO cambia entre rondas)
    const { word, category, translations } = getRandomWordWithCategory(match.language || 'es');
    match.secretWord = word;
    match.secretCategory = category;
    match.secretWordTranslations = translations;

    // Calcular jugador inicial UNA VEZ para todo el match
    // (roundPlayers debe estar configurado antes de calcular)
    match.roundPlayers = match.players.map((p) => p.uid);

    // Guardar el lastStartingPlayerId ANTES de actualizarlo (para restaurar en caso de muerte súbita)
    match.previousLastStartingPlayerId = match.lastStartingPlayerId;

    match.startingPlayerId = calculateStartingPlayer(match);
    match.lastStartingPlayerId = match.startingPlayerId;

    // Guardar el jugador inicial ORIGINAL (para detectar si fue reemplazado)
    match.originalStartingPlayerId = match.startingPlayerId;

    const impostorName = match.players.find((p) => p.uid === match.impostorId)?.name || "desconocido";
    const startingName = match.players.find((p) => p.uid === match.startingPlayerId)?.name || "desconocido";

    // Iniciar la primera ronda
    startNextRound(match);
}

/**
 * Iniciar siguiente ronda (nueva palabra, mismo impostor)
 */
function startNextRound(match) {
    match.currentRound++;
    match.votes = {};
    match.lastRoundScores = {};

    // Jugadores activos para esta ronda (excluyendo eliminados)
    match.roundPlayers = match.players
        .map((p) => p.uid)
        .filter((uid) => !match.eliminatedPlayers.includes(uid));

    // CRITICAL: Al presionar "Siguiente ronda", si ya hay un ganador (determinado en endRound o suddenDeath)
    // pasamos finalmente a game_over. Esto permite que el overlay de round_result se muestre primero.
    if (match.winnerId) {
        console.log(`[Match ${match.matchId}] Ganador detectado (${match.winnerId}). Finalizando match.`);
        match.phase = "game_over";
        match.persistAnalytics();
        return;
    }

    // CRITICAL: Verificar muerte súbita ANTES de iniciar ronda
    // Si solo quedan 2 jugadores (impostor + 1 amigo), el impostor gana automáticamente
    if (match.roundPlayers.length <= 2) {
        console.log(
            `[Match ${match.matchId}] ¡Muerte súbita detectada! Solo ${match.roundPlayers.length} jugadores. Impostor gana.`
        );
        handleSuddenDeath(match);
        return; // NO iniciar la ronda
    }

    // Solo recalcular jugador inicial si el actual fue eliminado
    // El mismo jugador debe iniciar TODAS las rondas de un match
    if (!match.roundPlayers.includes(match.startingPlayerId)) {
        const oldStartingPlayer = match.startingPlayerId;
        match.startingPlayerId = calculateStartingPlayer(match);
        // Actualizar lastStartingPlayerId para que el siguiente match rote desde el reemplazo
        // Ej: Si A fue eliminado y B lo reemplaza, el siguiente match empezará con C
        match.lastStartingPlayerId = match.startingPlayerId;
        const oldName = match.formerPlayers[oldStartingPlayer]?.name || oldStartingPlayer;
        const newName = match.players.find((p) => p.uid === match.startingPlayerId)?.name || "desconocido";
    }

    // La palabra ya fue seleccionada en startNewMatch, no cambia entre rondas
    const startingName = match.players.find((p) => p.uid === match.startingPlayerId)?.name || "desconocido";

    // Determinar fase según el modo de juego
    if (match.gameMode === 'chat') {
        // Chat mode: iniciar fase de ronda de pistas
        const ChatModeManager = require("./ChatModeManager");
        const roomManager = require("../services/roomManager");

        match.chatModeManager = new ChatModeManager(match, {
            onStateChange: () => {
                // Emit updated state to all players when timeout/turn changes
                const room = roomManager.getRoom(match.roomId);
                if (room) {
                    roomManager.emitRoomState(room);
                }
            }
        });
        match.chatModeManager.startClueRound();
        match.phase = "clue_round";
        console.log(`[Match ${match.matchId}] Ronda ${match.currentRound} - Modo Chat: fase clue_round`);
    } else {
        // Voice mode: ir directamente a votación
        match.phase = "playing";
    }
}

/**
 * Finalizar ronda
 * @param {Object} match - Estado del match
 * @param {boolean} impostorCaught - Si el impostor fue descubierto
 */
function endRound(match, impostorCaught) {
    if (impostorCaught) {
        // Amigos ganan - calcular puntos y terminar match
        calculateRoundScores(match, true);

        // Encontrar al amigo ganador (el que tiene más puntos)
        const winner = findWinner(match);
        match.winnerId = winner;
        match.phase = "round_result";
        // match.persistAnalytics será llamado cuando el host pase de round_result a game_over

        console.log(`[Match ${match.matchId}] ¡Impostor descubierto! Ganador: ${winner}`);
    } else {
        // Impostor sobrevivió esta ronda
        giveImpostorSurvivalPoints(match);

        if (match.currentRound >= match.maxRounds) {
            // Impostor sobrevivió 3 rondas - gana
            giveImpostorMaxPoints(match);
            match.winnerId = match.impostorId;
            match.phase = "round_result";
            console.log(`[Match ${match.matchId}] ¡Impostor sobrevivió 3 rondas! Gana.`);
        } else {
            // Continuar a la siguiente ronda
            match.phase = "round_result";
        }
    }
}

/**
 * Manejar muerte súbita (solo quedan 2 jugadores)
 */
function handleSuddenDeath(match) {
    giveImpostorMaxPoints(match);
    match.winnerId = match.impostorId;
    match.phase = "round_result";

    console.log(`[Match ${match.matchId}] ¡Muerte súbita! Solo quedan 2 jugadores. Impostor gana.`);
}

module.exports = {
    selectImpostor,
    startNewMatch,
    startNextRound,
    endRound,
    handleSuddenDeath,
    MAX_ROUNDS,
};
