function calculateRoundScores(game, friendsWon) {
    game.lastRoundScores = {};

    if (friendsWon) {
        // Amigos ganaron: dar puntos a quienes votaron correctamente
        game.turnHistory.forEach((turn) => {
            Object.entries(turn.votes).forEach(([voter, target]) => {
                if (target === game.impostorId && !game.eliminatedInRound.includes(voter)) {
                    game.playerScores[voter] = (game.playerScores[voter] || 0) + 1;
                    game.lastRoundScores[voter] = (game.lastRoundScores[voter] || 0) + 1;
                }
            });
        });

        // +1 punto adicional por expulsar al impostor
        game.roundPlayers.forEach((uid) => {
            if (uid !== game.impostorId && !game.eliminatedInRound.includes(uid)) {
                game.playerScores[uid] = (game.playerScores[uid] || 0) + 1;
                game.lastRoundScores[uid] = (game.lastRoundScores[uid] || 0) + 1;
            }
        });
    } else {
        // Impostor ganó
        // Dar puntos finales al impostor por ganar la ronda
        // Los puntos por sobrevivir vueltas intermedias ya fueron dados en startNextTurn
        // Pero los puntos por la vuelta final (donde ganó) se dan aquí
        const finalTurnPoints = game.currentTurn + 1; // Vuelta actual + 1 = puntos (V1=2, V2=3, V3=4)
        game.playerScores[game.impostorId] = (game.playerScores[game.impostorId] || 0) + finalTurnPoints;
        game.lastRoundScores[game.impostorId] = (game.lastRoundScores[game.impostorId] || 0) + finalTurnPoints;
        console.log(`[Game ${game.gameId}] Impostor gana la ronda en vuelta ${game.currentTurn}: +${finalTurnPoints} puntos`);

        // Dar puntos a amigos que votaron correctamente (aunque no ganaron)
        game.turnHistory.forEach((turn) => {
            Object.entries(turn.votes).forEach(([voter, target]) => {
                if (target === game.impostorId && voter !== game.impostorId) {
                    game.playerScores[voter] = (game.playerScores[voter] || 0) + 1;
                    game.lastRoundScores[voter] = (game.lastRoundScores[voter] || 0) + 1;
                }
            });
        });
    }

    console.log(`[Game ${game.gameId}] Puntos de esta ronda:`, game.lastRoundScores);
}

function checkGameOver(game) {
    // Verificar si alguien alcanzó el puntaje objetivo
    for (const [playerId, score] of Object.entries(game.playerScores)) {
        if (score >= game.targetScore) {
            return playerId;
        }
    }

    // Verificar si se alcanzó el máximo de rondas
    if (game.roundCount >= game.maxRounds) {
        // Encontrar al jugador con más puntos
        let maxScore = 0;
        const playersWithMaxScore = [];

        Object.entries(game.playerScores).forEach(([playerId, score]) => {
            if (score > maxScore) {
                maxScore = score;
                playersWithMaxScore.length = 0; // Limpiar array
                playersWithMaxScore.push(playerId);
            } else if (score === maxScore) {
                playersWithMaxScore.push(playerId);
            }
        });

        // Solo declarar ganador si hay uno claro (no empate)
        if (playersWithMaxScore.length === 1) {
            return playersWithMaxScore[0];
        }

        // Si hay empate, continuar jugando
        console.log(`[Game ${game.gameId}] Empate con ${maxScore} puntos. Continuando...`);
        return null;
    }

    return null;
}

module.exports = {
    calculateRoundScores,
    checkGameOver,
};
