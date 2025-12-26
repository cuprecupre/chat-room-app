/**
 * Sistema de Puntuación - Nueva Versión
 * 
 * AMIGOS: +2 puntos por votar correctamente al impostor (individual)
 * IMPOSTOR: +3 (R1), +2 (R2), +2 (R3) por sobrevivir = máx 7 puntos
 * 
 * Victoria:
 * - Impostor gana si sobrevive 3 rondas o muerte súbita
 * - Amigo con más puntos gana si descubren al impostor
 */

const FRIEND_POINTS_PER_CORRECT_VOTE = 2;
const IMPOSTOR_POINTS_BY_ROUND = {
    1: 3,  // Bonus por dificultad inicial
    2: 2,
    3: 2
};
const IMPOSTOR_MAX_POINTS = 7;

/**
 * Dar puntos al impostor por sobrevivir la ronda actual
 */
function giveImpostorSurvivalPoints(game) {
    const roundPoints = IMPOSTOR_POINTS_BY_ROUND[game.currentRound] || 2;
    game.playerScores[game.impostorId] = (game.playerScores[game.impostorId] || 0) + roundPoints;
    game.lastRoundScores[game.impostorId] = (game.lastRoundScores[game.impostorId] || 0) + roundPoints;

    console.log(
        `[Game ${game.gameId}] Impostor sobrevivió ronda ${game.currentRound}: +${roundPoints} puntos`
    );
}

/**
 * Dar puntos máximos al impostor (muerte súbita)
 */
function giveImpostorMaxPoints(game) {
    const currentPoints = game.playerScores[game.impostorId] || 0;
    const pointsToAdd = IMPOSTOR_MAX_POINTS - currentPoints;

    if (pointsToAdd > 0) {
        game.playerScores[game.impostorId] = IMPOSTOR_MAX_POINTS;
        game.lastRoundScores[game.impostorId] = (game.lastRoundScores[game.impostorId] || 0) + pointsToAdd;
        console.log(
            `[Game ${game.gameId}] Muerte súbita: Impostor recibe +${pointsToAdd} puntos (máximo ${IMPOSTOR_MAX_POINTS})`
        );
    }
}

/**
 * Calcular puntos cuando los amigos ganan (impostor descubierto)
 */
function calculateFriendsWinScores(game) {
    game.lastRoundScores = {};

    // Amigos: +2 puntos por cada voto correcto al impostor
    Object.entries(game.votes).forEach(([voter, target]) => {
        if (target === game.impostorId && voter !== game.impostorId) {
            game.playerScores[voter] = (game.playerScores[voter] || 0) + FRIEND_POINTS_PER_CORRECT_VOTE;
            game.lastRoundScores[voter] = (game.lastRoundScores[voter] || 0) + FRIEND_POINTS_PER_CORRECT_VOTE;
        }
    });

    console.log(`[Game ${game.gameId}] Amigos ganan. Puntos de esta ronda:`, game.lastRoundScores);
}

/**
 * Calcular puntos de la ronda
 * @param {Object} game - Estado del juego
 * @param {boolean} friendsWon - Si los amigos ganaron (descubrieron al impostor)
 */
function calculateRoundScores(game, friendsWon) {
    if (friendsWon) {
        calculateFriendsWinScores(game);
    } else {
        // Impostor ya recibió sus puntos en giveImpostorSurvivalPoints o giveImpostorMaxPoints
        // Solo loguear el estado final
        console.log(`[Game ${game.gameId}] Impostor gana. Puntos finales:`, game.playerScores);
    }
}

/**
 * Encontrar al ganador (amigo con más puntos)
 * @returns {string|null} - ID del jugador ganador o null si empate
 */
function findWinner(game) {
    let maxScore = 0;
    const playersWithMaxScore = [];

    Object.entries(game.playerScores).forEach(([playerId, score]) => {
        // Excluir al impostor de la búsqueda del ganador amigo
        if (playerId === game.impostorId) return;

        if (score > maxScore) {
            maxScore = score;
            playersWithMaxScore.length = 0;
            playersWithMaxScore.push(playerId);
        } else if (score === maxScore && score > 0) {
            playersWithMaxScore.push(playerId);
        }
    });

    // Si hay empate o nadie tiene puntos
    if (playersWithMaxScore.length !== 1) {
        console.log(`[Game ${game.gameId}] Empate entre amigos o sin puntos:`, playersWithMaxScore);
        // En caso de empate, devolver el primero (o podría devolver todos)
        return playersWithMaxScore[0] || null;
    }

    return playersWithMaxScore[0];
}

/**
 * Verificar si el juego terminó
 * @returns {Object} - { isOver: boolean, winner: string|null, reason: string }
 */
function checkGameOver(game) {
    // Ya no hay objetivo de 15 puntos
    // El juego termina cuando se descubre al impostor o tras 3 rondas
    // Esta función ahora solo se usa para verificar condiciones especiales
    return { isOver: false, winner: null, reason: null };
}

module.exports = {
    giveImpostorSurvivalPoints,
    giveImpostorMaxPoints,
    calculateRoundScores,
    calculateFriendsWinScores,
    findWinner,
    checkGameOver,
    FRIEND_POINTS_PER_CORRECT_VOTE,
    IMPOSTOR_POINTS_BY_ROUND,
    IMPOSTOR_MAX_POINTS
};
