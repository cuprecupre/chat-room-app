const { endRound, startNextTurn } = require("./RoundManager");
const { getActivePlayers } = require("./PlayerManager");

function castVote(game, voterId, targetId) {
    // Validaciones
    if (game.phase !== "playing") {
        throw new Error("Solo puedes votar durante una ronda activa.");
    }

    if (game.eliminatedInRound.includes(voterId)) {
        throw new Error("Los jugadores eliminados no pueden votar.");
    }

    if (!game.roundPlayers.includes(voterId)) {
        throw new Error("No estás participando en esta ronda.");
    }

    // Si targetId es null, desmarcar voto
    if (targetId === null || targetId === undefined) {
        if (game.votes[voterId]) {
            delete game.votes[voterId];
            console.log(`[Game ${game.gameId}] ${voterId} desmarcó su voto`);
        }
        return;
    }

    if (voterId === targetId) {
        throw new Error("No puedes votarte a ti mismo.");
    }

    if (game.eliminatedInRound.includes(targetId)) {
        throw new Error("No puedes votar a un jugador eliminado.");
    }

    if (!game.roundPlayers.includes(targetId)) {
        throw new Error("Ese jugador no está en esta ronda.");
    }

    // Registrar o cambiar voto
    const isChangingVote = game.votes[voterId] !== undefined;
    game.votes[voterId] = targetId;
    console.log(
        `[Game ${game.gameId}] ${voterId} ${isChangingVote ? "cambió su voto a" : "votó a"} ${targetId}`
    );

    // Verificar si todos han votado
    checkIfAllVoted(game);
}

function checkIfAllVoted(game) {
    const activePlayers = getActivePlayers(game);
    const votedPlayers = Object.keys(game.votes).filter((uid) => activePlayers.includes(uid));

    if (votedPlayers.length === activePlayers.length) {
        console.log(`[Game ${game.gameId}] Todos han votado. Procesando resultados...`);
        processVotingResults(game);
    }
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

    // Guardar historial
    game.turnHistory.push({
        turn: game.currentTurn,
        votes: { ...game.votes },
        voteCount: { ...voteCount },
        eliminated: mostVoted.length === 1 ? mostVoted[0] : null,
        tie: mostVoted.length > 1 || mostVoted.length === 0,
    });

    // Manejar empate o sin votos
    if (mostVoted.length !== 1) {
        const reason =
            mostVoted.length === 0 ? "sin votos" : `empate entre: ${mostVoted.join(", ")}`;
        console.log(`[Game ${game.gameId}] No hay eliminación (${reason}).`);

        if (game.currentTurn >= game.maxTurns) {
            console.log(
                `[Game ${game.gameId}] Vuelta 3 completada sin eliminación. ¡El impostor gana!`
            );
            endRound(game, false);
        } else {
            console.log(`[Game ${game.gameId}] Empate: siguiente vuelta sin puntos.`);
            game.lastEliminatedInTurn = null;
            startNextTurn(game, true);
        }
        return;
    }

    // Expulsar al más votado
    const eliminatedId = mostVoted[0];
    game.eliminatedInRound.push(eliminatedId);
    console.log(`[Game ${game.gameId}] ${eliminatedId} ha sido eliminado.`);

    // Verificar si era el impostor
    if (eliminatedId === game.impostorId) {
        console.log(`[Game ${game.gameId}] ¡El impostor fue descubierto!`);
        endRound(game, true);
    } else {
        // Era un amigo, verificar cuántos quedan
        const activePlayers = getActivePlayers(game);

        // Si solo quedan 2 jugadores (impostor + 1 amigo), el impostor gana automáticamente
        if (activePlayers.length <= 2) {
            console.log(`[Game ${game.gameId}] Solo quedan 2 jugadores. ¡El impostor gana automáticamente!`);
            endRound(game, false);
        } else if (game.currentTurn >= game.maxTurns) {
            console.log(`[Game ${game.gameId}] Tercera vuelta completada. ¡El impostor gana!`);
            endRound(game, false);
        } else {
            game.lastEliminatedInTurn = eliminatedId;
            startNextTurn(game);
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
