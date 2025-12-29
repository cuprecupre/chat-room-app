/**
 * Sistema de Puntuación - Versión con Bonus
 *
 * AMIGOS: +2 puntos por votar correctamente al impostor (individual)
 * IMPOSTOR: +2 por ronda por sobrevivir = máx 6 puntos base
 *
 * BONUS: El ganador siempre llega a 10 puntos
 * - Impostor gana: 10 - puntos acumulados = bonus
 * - Amigo perfecto gana (votó bien TODAS las rondas): 10 - puntos acumulados = bonus
 */

const FRIEND_POINTS_PER_CORRECT_VOTE = 2;
const IMPOSTOR_POINTS_PER_ROUND = 2;
const TARGET_SCORE = 10;

/**
 * Dar puntos al impostor por sobrevivir la ronda actual
 */
function giveImpostorSurvivalPoints(game) {
    game.playerScores[game.impostorId] =
        (game.playerScores[game.impostorId] || 0) + IMPOSTOR_POINTS_PER_ROUND;
    game.lastRoundScores[game.impostorId] =
        (game.lastRoundScores[game.impostorId] || 0) + IMPOSTOR_POINTS_PER_ROUND;

    console.log(
        `[Game ${game.gameId}] Impostor sobrevivió ronda ${game.currentRound}: +${IMPOSTOR_POINTS_PER_ROUND} puntos`
    );
}

/**
 * Dar bonus al ganador para llegar a TARGET_SCORE (10 puntos)
 * @param {Object} game - Estado del juego
 * @param {string} winnerId - ID del ganador
 */
function giveWinnerBonus(game, winnerId) {
    const currentPoints = game.playerScores[winnerId] || 0;
    const bonusPoints = TARGET_SCORE - currentPoints;

    if (bonusPoints > 0) {
        game.playerScores[winnerId] = TARGET_SCORE;
        game.lastRoundScores[winnerId] = (game.lastRoundScores[winnerId] || 0) + bonusPoints;

        // Track bonus for UI display
        game.playerBonus = game.playerBonus || {};
        game.playerBonus[winnerId] = bonusPoints;

        console.log(
            `[Game ${game.gameId}] Bonus para ganador ${winnerId}: +${bonusPoints} puntos (total: ${TARGET_SCORE})`
        );
    }
}

/**
 * Dar puntos máximos al impostor (muerte súbita o sobrevivir 3 rondas)
 */
function giveImpostorMaxPoints(game) {
    giveWinnerBonus(game, game.impostorId);
    console.log(
        `[Game ${game.gameId}] Impostor gana. Bonus aplicado hasta ${TARGET_SCORE} puntos.`
    );
}

/**
 * Dar puntos a los amigos que votaron correctamente al impostor
 * Se llama al final de CADA ronda, independientemente del resultado
 * También trackea quién votó bien para determinar el "amigo perfecto"
 */
function giveCorrectVotersPoints(game) {
    // Initialize tracking if not exists
    game.correctVotesPerPlayer = game.correctVotesPerPlayer || {};

    Object.entries(game.votes).forEach(([voter, target]) => {
        // Solo amigos (no el impostor) que votaron al impostor
        if (target === game.impostorId && voter !== game.impostorId) {
            game.playerScores[voter] =
                (game.playerScores[voter] || 0) + FRIEND_POINTS_PER_CORRECT_VOTE;
            game.lastRoundScores[voter] =
                (game.lastRoundScores[voter] || 0) + FRIEND_POINTS_PER_CORRECT_VOTE;

            // Track correct votes for this player
            game.correctVotesPerPlayer[voter] = (game.correctVotesPerPlayer[voter] || 0) + 1;
        }
    });

    const correctVoters = Object.entries(game.votes)
        .filter(([voter, target]) => target === game.impostorId && voter !== game.impostorId)
        .map(([voter]) => voter);

    if (correctVoters.length > 0) {
        console.log(
            `[Game ${game.gameId}] Amigos que votaron bien: ${correctVoters.length} (+${FRIEND_POINTS_PER_CORRECT_VOTE} pts cada uno)`
        );
    }
}

/**
 * Calcular puntos cuando los amigos ganan (impostor descubierto)
 * Da bonus al "amigo perfecto" (votó bien TODAS las rondas)
 */
function calculateFriendsWinScores(game) {
    // Find the "perfect friend" - someone who voted correctly in ALL rounds
    const totalRounds = game.currentRound;
    const perfectFriends = [];

    Object.entries(game.correctVotesPerPlayer || {}).forEach(([playerId, correctVotes]) => {
        if (correctVotes === totalRounds) {
            perfectFriends.push(playerId);
        }
    });

    if (perfectFriends.length > 0) {
        // Give bonus to ALL perfect friends
        perfectFriends.forEach((playerId) => {
            giveWinnerBonus(game, playerId);
            console.log(
                `[Game ${game.gameId}] Amigo perfecto encontrado: ${playerId} (votó bien ${totalRounds}/${totalRounds} rondas)`
            );
        });
    } else {
        console.log(`[Game ${game.gameId}] No hay amigo perfecto. Gana el amigo con más puntos.`);
    }

    console.log(`[Game ${game.gameId}] Amigos ganan. Puntos finales:`, game.playerScores);
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
    giveCorrectVotersPoints,
    giveWinnerBonus,
    calculateRoundScores,
    calculateFriendsWinScores,
    findWinner,
    checkGameOver,
    FRIEND_POINTS_PER_CORRECT_VOTE,
    IMPOSTOR_POINTS_PER_ROUND,
    TARGET_SCORE,
};
