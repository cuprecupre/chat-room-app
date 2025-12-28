/**
 * VotingManager - Nueva Versión
 *
 * Cambios clave:
 * - Empates: impostor SÍ recibe puntos y pasa a siguiente ronda
 * - Muerte súbita: si quedan 2 jugadores, impostor gana
 * - No hay "vueltas" dentro de rondas, cada ronda es una votación
 */

const { endRound, startNextRound, handleSuddenDeath } = require("./RoundManager");
const { giveImpostorSurvivalPoints, giveCorrectVotersPoints } = require("./ScoringManager");
const { getActivePlayers } = require("./PlayerManager");

function castVote(game, voterId, targetId) {
    // Debug log
    console.log(`[Vote Debug] Game ${game.gameId}:`, {
        phase: game.phase,
        roundPlayers: game.roundPlayers,
        eliminatedPlayers: game.eliminatedPlayers,
        voterId,
        targetId,
    });

    // Validaciones
    if (game.phase !== "playing") {
        throw new Error("Solo puedes votar durante una ronda activa.");
    }

    const eliminated = game.eliminatedPlayers || [];
    const roundPlayers = game.roundPlayers || [];

    if (eliminated.includes(voterId)) {
        throw new Error("Los jugadores eliminados no pueden votar.");
    }

    if (!roundPlayers.includes(voterId)) {
        throw new Error("No estás participando en esta ronda.");
    }

    // Si targetId es null, desmarcar voto
    if (targetId === null || targetId === undefined) {
        if (game.votes[voterId]) {
            delete game.votes[voterId];
            console.log(`[Game ${game.gameId}] ${voterId} desmarcó su voto`);
        }
        return { phaseChanged: false, allVoted: false };
    }

    if (voterId === targetId) {
        throw new Error("No puedes votarte a ti mismo.");
    }

    if (eliminated.includes(targetId)) {
        throw new Error("No puedes votar a un jugador eliminado.");
    }

    if (!roundPlayers.includes(targetId)) {
        throw new Error("Ese jugador no está en esta ronda.");
    }

    // Registrar o cambiar voto
    const isChangingVote = game.votes[voterId] !== undefined;
    game.votes[voterId] = targetId;
    console.log(
        `[Game ${game.gameId}] ${voterId} ${isChangingVote ? "cambió su voto a" : "votó a"} ${targetId}`
    );

    // Capturar fase antes de verificar votación
    const phaseBefore = game.phase;

    // Verificar si todos han votado
    const allVoted = checkIfAllVoted(game);

    // Determinar si la fase cambió (votación terminó)
    const phaseChanged = game.phase !== phaseBefore;

    return { phaseChanged, allVoted };
}

function checkIfAllVoted(game) {
    const activePlayers = getActivePlayers(game);
    const votedPlayers = Object.keys(game.votes).filter((uid) => activePlayers.includes(uid));

    if (votedPlayers.length === activePlayers.length) {
        console.log(`[Game ${game.gameId}] Todos han votado. Procesando resultados...`);
        processVotingResults(game);
        return true;
    }
    return false;
}

function processVotingResults(game) {
    const voteCount = {};
    const activePlayers = getActivePlayers(game);

    console.log(`[Game ${game.gameId}] Procesando resultados. Jugadores activos:`, activePlayers);
    console.log(`[Game ${game.gameId}] Votos registrados:`, game.votes);

    Object.entries(game.votes).forEach(([voter, target]) => {
        if (activePlayers.includes(voter)) {
            voteCount[target] = (voteCount[target] || 0) + 1;
        }
    });

    console.log(`[Game ${game.gameId}] Conteo de votos:`, voteCount);

    // Encontrar el más votado
    let maxVotes = 0;
    let mostVoted = [];

    Object.entries(voteCount).forEach(([playerId, votes]) => {
        if (votes > maxVotes) {
            maxVotes = votes;
            mostVoted = [playerId];
        } else if (votes === maxVotes) {
            mostVoted.push(playerId);
        }
    });

    console.log(`[Game ${game.gameId}] Más votados:`, mostVoted, `con ${maxVotes} votos`);

    // Guardar historial de la ronda
    game.roundHistory = game.roundHistory || [];
    game.roundHistory.push({
        round: game.currentRound,
        votes: { ...game.votes },
        voteCount: { ...voteCount },
        eliminated: mostVoted.length === 1 ? mostVoted[0] : null,
        tie: mostVoted.length !== 1,
    });

    // IMPORTANTE: Dar puntos a amigos que votaron correctamente ANTES de procesar resultado
    // Esto asegura que reciban puntos sin importar si el impostor es eliminado o no
    game.lastRoundScores = {};
    giveCorrectVotersPoints(game);

    // Manejar empate o sin votos válidos
    if (mostVoted.length !== 1) {
        const reason =
            mostVoted.length === 0 ? "sin votos" : `empate entre: ${mostVoted.join(", ")}`;
        console.log(`[Game ${game.gameId}] No hay eliminación (${reason}).`);

        // NUEVO: En empate, el impostor SÍ recibe puntos
        giveImpostorSurvivalPoints(game);

        if (game.currentRound >= game.maxRounds) {
            // Ronda 3 con empate: impostor gana (puntos ya dados arriba)
            console.log(`[Game ${game.gameId}] Ronda 3 con empate. ¡El impostor gana!`);
            game.winnerId = game.impostorId;
            game.phase = "game_over";
            game.persist();
        } else {
            // Siguiente ronda
            console.log(`[Game ${game.gameId}] Empate: impostor recibe puntos. Siguiente ronda.`);
            game.phase = "round_result";
            game.persist();
        }
        return;
    }

    // Hay un jugador claramente más votado
    const eliminatedId = mostVoted[0];

    // Verificar si era el impostor
    if (eliminatedId === game.impostorId) {
        console.log(`[Game ${game.gameId}] ¡El impostor fue descubierto!`);
        endRound(game, true); // Amigos ganan
    } else {
        // Era un amigo - eliminarlo
        game.eliminatedPlayers = game.eliminatedPlayers || [];
        game.eliminatedPlayers.push(eliminatedId);
        console.log(`[Game ${game.gameId}] ${eliminatedId} ha sido eliminado (era amigo).`);

        // Recalcular jugadores activos
        const remainingPlayers = getActivePlayers(game);

        // Verificar muerte súbita (solo quedan 2 jugadores = impostor + 1 amigo)
        if (remainingPlayers.length <= 2) {
            console.log(`[Game ${game.gameId}] ¡Muerte súbita! Solo quedan 2 jugadores.`);
            handleSuddenDeath(game);
        } else if (game.currentRound >= game.maxRounds) {
            // Ronda 3 completada, impostor sobrevive
            console.log(`[Game ${game.gameId}] Ronda 3 completada. ¡El impostor gana!`);
            endRound(game, false);
        } else {
            // Impostor sobrevive, siguiente ronda
            endRound(game, false);
        }
    }
}

function hasVoted(game, playerId) {
    return game.votes.hasOwnProperty(playerId);
}

module.exports = {
    castVote,
    checkIfAllVoted,
    processVotingResults,
    hasVoted,
};
