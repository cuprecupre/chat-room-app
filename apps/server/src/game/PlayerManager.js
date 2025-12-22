function addPlayer(game, user) {
    if (!game.players.some((p) => p.uid === user.uid)) {
        const joinedAt = Date.now();
        game.players.push({
            uid: user.uid,
            name: user.name,
            photoURL: user.photoURL || null,
            joinedAt: joinedAt,
        });
        // Guardar copia de datos del jugador
        game.formerPlayers[user.uid] = {
            name: user.name,
            photoURL: user.photoURL || null,
        };
        // Inicializar puntuación del jugador
        game.playerScores[user.uid] = 0;
        // Actualizar orden base (OB)
        updatePlayerOrder(game);
    }
}

function removePlayer(game, userId) {
    const playerIsImpostor = game.impostorId === userId;
    const wasHost = game.hostId === userId;

    // Guardar datos del jugador antes de eliminarlo
    const leavingPlayer = game.players.find((p) => p.uid === userId);
    if (leavingPlayer) {
        game.formerPlayers[userId] = {
            name: leavingPlayer.name,
            photoURL: leavingPlayer.photoURL || null,
        };
    }

    game.players = game.players.filter((p) => p.uid !== userId);
    game.roundPlayers = game.roundPlayers.filter((uid) => uid !== userId);
    game.eliminatedInRound = game.eliminatedInRound.filter((uid) => uid !== userId);
    delete game.votes[userId];

    // Actualizar orden base cuando un jugador se va
    updatePlayerOrder(game);

    // Transferir host si el que se fue era el host
    let newHostInfo = null;
    if (wasHost && game.players.length > 0) {
        const nextHostId = game.playerOrder.find((uid) => game.players.some((p) => p.uid === uid));
        if (nextHostId) {
            game.hostId = nextHostId;
            const newHost = game.players.find((p) => p.uid === nextHostId);
            newHostInfo = {
                uid: nextHostId,
                name: newHost ? newHost.name : "Jugador",
            };
            console.log(
                `[Game ${game.gameId}] Host transferido a ${newHostInfo.name} (${nextHostId})`
            );
        }
    }

    // If the impostor leaves during the game, end the round
    if (game.phase === "playing" && playerIsImpostor) {
        game.phase = "round_result";
    }

    return { newHostInfo, playerIsImpostor };
}

function updatePlayerOrder(game) {
    const sortedPlayers = [...game.players].sort((a, b) => {
        return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
    game.playerOrder = sortedPlayers.map((p) => p.uid);
    console.log(`[Game ${game.gameId}] Orden base actualizado:`, game.playerOrder);
}

function calculateStartingPlayer(game) {
    const eligiblePlayers = game.playerOrder.filter((uid) => game.roundPlayers.includes(uid));

    if (eligiblePlayers.length === 0) {
        console.log(`[Game ${game.gameId}] No hay jugadores elegibles para iniciar ronda`);
        return null;
    }

    const roundIndex = (game.roundCount - 1) % eligiblePlayers.length;
    const startingPlayerId = eligiblePlayers[roundIndex];

    const startingPlayer = game.players.find((p) => p.uid === startingPlayerId);
    console.log(
        `[Game ${game.gameId}] Ronda ${game.roundCount}: Jugador inicial = ${startingPlayer?.name} (índice ${roundIndex} de ${eligiblePlayers.length} elegibles)`
    );

    return startingPlayerId;
}

function getActivePlayers(game) {
    return game.roundPlayers.filter((uid) => !game.eliminatedInRound.includes(uid));
}

module.exports = {
    addPlayer,
    removePlayer,
    updatePlayerOrder,
    calculateStartingPlayer,
    getActivePlayers,
};
