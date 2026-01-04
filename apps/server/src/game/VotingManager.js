/**
 * VotingManager - Nueva Versión
 *
 * Cambios clave:
 * - Empates: impostor SÍ recibe puntos y pasa a siguiente ronda
 * - Muerte súbita: si quedan 2 jugadores, impostor gana
 * - No hay "vueltas" dentro de rondas, cada ronda es una votación
 */

const { endRound, startNextRound, handleSuddenDeath } = require("./RoundManager");
const {
    giveImpostorSurvivalPoints,
    giveCorrectVotersPoints,
    giveImpostorMaxPoints,
} = require("./ScoringManager");
const { getActivePlayers } = require("./PlayerManager");

function castVote(match, voterId, targetId) {
    // Debug log
    console.log(`[Vote Debug] Match ${match.matchId}:`, {
        phase: match.phase,
        roundPlayers: match.roundPlayers,
        eliminatedPlayers: match.eliminatedPlayers,
        voterId,
        targetId,
    });

    // Validaciones
    if (match.phase !== "playing") {
        throw new Error("Solo puedes votar durante una ronda activa.");
    }

    const eliminated = match.eliminatedPlayers || [];
    const roundPlayers = match.roundPlayers || [];

    if (eliminated.includes(voterId)) {
        throw new Error("Los jugadores eliminados no pueden votar.");
    }

    if (!roundPlayers.includes(voterId)) {
        throw new Error("No estás participando en esta ronda.");
    }

    // Si targetId es null, desmarcar voto
    if (targetId === null || targetId === undefined) {
        if (match.votes[voterId]) {
            delete match.votes[voterId];
            console.log(`[Match ${match.matchId}] ${voterId} desmarcó su voto`);
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
    const isChangingVote = match.votes[voterId] !== undefined;
    match.votes[voterId] = targetId;
    console.log(
        `[Match ${match.matchId}] ${voterId} ${isChangingVote ? "cambió su voto a" : "votó a"} ${targetId}`
    );

    // Capturar fase antes de verificar votación
    const phaseBefore = match.phase;

    // Verificar si todos han votado
    const allVoted = checkIfAllVoted(match);

    // Determinar si la fase cambió (votación terminó)
    const phaseChanged = match.phase !== phaseBefore;

    return { phaseChanged, allVoted };
}

function checkIfAllVoted(match) {
    const activePlayers = getActivePlayers(match);
    const votedPlayers = Object.keys(match.votes).filter((uid) => activePlayers.includes(uid));

    if (votedPlayers.length === activePlayers.length) {
        console.log(`[Match ${match.matchId}] Todos han votado. Procesando resultados...`);
        processVotingResults(match);
        return true;
    }
    return false;
}

function processVotingResults(match) {
    const voteCount = {};
    const activePlayers = getActivePlayers(match);

    console.log(`[Match ${match.matchId}] Procesando resultados. Jugadores activos:`, activePlayers);
    console.log(`[Match ${match.matchId}] Votos registrados:`, match.votes);

    Object.entries(match.votes).forEach(([voter, target]) => {
        if (activePlayers.includes(voter)) {
            voteCount[target] = (voteCount[target] || 0) + 1;
        }
    });

    console.log(`[Match ${match.matchId}] Conteo de votos:`, voteCount);

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

    console.log(`[Match ${match.matchId}] Más votados:`, mostVoted, `con ${maxVotes} votos`);

    // Guardar historial de la ronda
    match.roundHistory = match.roundHistory || [];
    match.roundHistory.push({
        round: match.currentRound,
        votes: { ...match.votes },
        voteCount: { ...voteCount },
        eliminated: mostVoted.length === 1 ? mostVoted[0] : null,
        tie: mostVoted.length !== 1,
    });

    // IMPORTANTE: Dar puntos a amigos que votaron correctamente ANTES de procesar resultado
    // Esto asegura que reciban puntos sin importar si el impostor es eliminado o no
    match.lastRoundScores = {};
    giveCorrectVotersPoints(match);

    // Manejar empate o sin votos válidos
    if (mostVoted.length !== 1) {
        const reason =
            mostVoted.length === 0 ? "sin votos" : `empate entre: ${mostVoted.join(", ")}`;
        console.log(`[Match ${match.matchId}] No hay eliminación (${reason}).`);

        // NUEVO: En empate, el impostor SÍ recibe puntos
        giveImpostorSurvivalPoints(match);

        if (match.currentRound >= match.maxRounds) {
            // Ronda 3 con empate: impostor gana
            giveImpostorMaxPoints(match);
            console.log(`[Match ${match.matchId}] Ronda 3 con empate. ¡El impostor gana!`);
            match.winnerId = match.impostorId;
            match.phase = "game_over";
            match.persistAnalytics("tie_round3");
        } else {
            // Siguiente ronda
            console.log(`[Match ${match.matchId}] Empate: impostor recibe puntos. Siguiente ronda.`);
            match.phase = "round_result";
        }
        return;
    }

    // Hay un jugador claramente más votado
    const eliminatedId = mostVoted[0];

    // Verificar si era el impostor
    if (eliminatedId === match.impostorId) {
        console.log(`[Match ${match.matchId}] ¡El impostor fue descubierto!`);
        endRound(match, true); // Amigos ganan
    } else {
        // Era un amigo - eliminarlo
        match.eliminatedPlayers = match.eliminatedPlayers || [];
        match.eliminatedPlayers.push(eliminatedId);
        console.log(`[Match ${match.matchId}] ${eliminatedId} ha sido eliminado (era amigo).`);

        // Recalcular jugadores activos
        const remainingPlayers = getActivePlayers(match);

        // Verificar muerte súbita (solo quedan 2 jugadores = impostor + 1 amigo)
        if (remainingPlayers.length <= 2) {
            console.log(`[Match ${match.matchId}] ¡Muerte súbita! Solo quedan 2 jugadores.`);
            handleSuddenDeath(match);
        } else if (match.currentRound >= match.maxRounds) {
            // Ronda 3 completada, impostor sobrevive
            console.log(`[Match ${match.matchId}] Ronda 3 completada. ¡El impostor gana!`);
            endRound(match, false);
        } else {
            // Impostor sobrevive, siguiente ronda
            endRound(match, false);
        }
    }
}

function hasVoted(match, playerId) {
    return match.votes.hasOwnProperty(playerId);
}

module.exports = {
    castVote,
    checkIfAllVoted,
    processVotingResults,
    hasVoted,
};
