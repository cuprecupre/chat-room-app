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
function giveImpostorSurvivalPoints(match) {
    match.playerScores[match.impostorId] =
        (match.playerScores[match.impostorId] || 0) + IMPOSTOR_POINTS_PER_ROUND;
    match.lastRoundScores[match.impostorId] =
        (match.lastRoundScores[match.impostorId] || 0) + IMPOSTOR_POINTS_PER_ROUND;

    console.log(
        `[Match ${match.matchId}] Impostor sobrevivió ronda ${match.currentRound}: +${IMPOSTOR_POINTS_PER_ROUND} puntos`
    );
}

/**
 * Dar bonus al ganador para llegar a TARGET_SCORE (10 puntos)
 * @param {Object} match - Estado del match
 * @param {string} winnerId - ID del ganador
 */
function giveWinnerBonus(match, winnerId) {
    const currentPoints = match.playerScores[winnerId] || 0;
    const bonusPoints = TARGET_SCORE - currentPoints;

    if (bonusPoints > 0) {
        match.playerScores[winnerId] = TARGET_SCORE;
        match.lastRoundScores[winnerId] = (match.lastRoundScores[winnerId] || 0) + bonusPoints;

        // Track bonus for UI display
        match.playerBonus = match.playerBonus || {};
        match.playerBonus[winnerId] = bonusPoints;

        console.log(
            `[Match ${match.matchId}] Bonus para ganador ${winnerId}: +${bonusPoints} puntos (total: ${TARGET_SCORE})`
        );
    }
}

/**
 * Dar puntos máximos al impostor (muerte súbita o sobrevivir 3 rondas)
 */
function giveImpostorMaxPoints(match) {
    giveWinnerBonus(match, match.impostorId);
    console.log(
        `[Match ${match.matchId}] Impostor gana. Bonus aplicado hasta ${TARGET_SCORE} puntos.`
    );
}

/**
 * Dar puntos a los amigos que votaron correctamente al impostor
 * Se llama al final de CADA ronda, independientemente del resultado
 * También trackea quién votó bien para determinar el "amigo perfecto"
 */
function giveCorrectVotersPoints(match) {
    // Initialize tracking if not exists
    match.correctVotesPerPlayer = match.correctVotesPerPlayer || {};

    Object.entries(match.votes).forEach(([voter, target]) => {
        // Solo amigos (no el impostor) que votaron al impostor
        if (target === match.impostorId && voter !== match.impostorId) {
            match.playerScores[voter] =
                (match.playerScores[voter] || 0) + FRIEND_POINTS_PER_CORRECT_VOTE;
            match.lastRoundScores[voter] =
                (match.lastRoundScores[voter] || 0) + FRIEND_POINTS_PER_CORRECT_VOTE;

            // Track correct votes for this player
            match.correctVotesPerPlayer[voter] = (match.correctVotesPerPlayer[voter] || 0) + 1;
        }
    });

    const correctVoters = Object.entries(match.votes)
        .filter(([voter, target]) => target === match.impostorId && voter !== match.impostorId)
        .map(([voter]) => voter);

    if (correctVoters.length > 0) {
        console.log(
            `[Match ${match.matchId}] Amigos que votaron bien: ${correctVoters.length} (+${FRIEND_POINTS_PER_CORRECT_VOTE} pts cada uno)`
        );
    }
}

/**
 * Calcular puntos cuando los amigos ganan (impostor descubierto)
 * Da bonus al "amigo perfecto" (votó bien TODAS las rondas)
 */
function calculateFriendsWinScores(match) {
    // Find the "perfect friend" - someone who voted correctly in ALL rounds
    const totalRounds = match.currentRound;
    const perfectFriends = [];

    Object.entries(match.correctVotesPerPlayer || {}).forEach(([playerId, correctVotes]) => {
        if (correctVotes === totalRounds) {
            perfectFriends.push(playerId);
        }
    });

    if (perfectFriends.length > 0) {
        // Give bonus to ALL perfect friends
        perfectFriends.forEach((playerId) => {
            giveWinnerBonus(match, playerId);
            console.log(
                `[Match ${match.matchId}] Amigo perfecto encontrado: ${playerId} (votó bien ${totalRounds}/${totalRounds} rondas)`
            );
        });
    } else {
        console.log(`[Match ${match.matchId}] No hay amigo perfecto. Gana el amigo con más puntos.`);
    }

    console.log(`[Match ${match.matchId}] Amigos ganan. Puntos finales:`, match.playerScores);
}

/**
 * Calcular puntos de la ronda
 * @param {Object} match - Estado del match
 * @param {boolean} friendsWon - Si los amigos ganaron (descubrieron al impostor)
 */
function calculateRoundScores(match, friendsWon) {
    if (friendsWon) {
        calculateFriendsWinScores(match);
    } else {
        // Impostor ya recibió sus puntos en giveImpostorSurvivalPoints o giveImpostorMaxPoints
        // Solo loguear el estado final
        console.log(`[Match ${match.matchId}] Impostor gana. Puntos finales:`, match.playerScores);
    }
}

/**
 * Encontrar al ganador (amigo con más puntos)
 * @returns {string|null} - ID del jugador ganador o null si empate
 */
function findWinner(match) {
    let maxScore = 0;
    const playersWithMaxScore = [];

    Object.entries(match.playerScores).forEach(([playerId, score]) => {
        // Excluir al impostor de la búsqueda del ganador amigo
        if (playerId === match.impostorId) return;

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
        console.log(`[Match ${match.matchId}] Empate entre amigos o sin puntos:`, playersWithMaxScore);
        // En caso de empate, devolver el primero (o podría devolver todos)
        return playersWithMaxScore[0] || null;
    }

    return playersWithMaxScore[0];
}

/**
 * Verificar si el match terminó (ya no confundir con game)
 */
function checkMatchOver(match) {
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
    checkMatchOver,
    FRIEND_POINTS_PER_CORRECT_VOTE,
    IMPOSTOR_POINTS_PER_ROUND,
    TARGET_SCORE,
};
