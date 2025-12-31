function addPlayer(game, user) {
    if (!game.players.some((p) => p.uid === user.uid)) {
        const joinedAt = Date.now();
        // Sanitize photoURL to avoid massive Base64 strings causing DB/Socket lag
        let safePhotoURL = user.photoURL || null;
        if (safePhotoURL && safePhotoURL.length > 500) {
            console.warn(
                `[PlayerManager] Warning: PhotoURL for ${user.uid} is too long (${safePhotoURL.length} chars). Truncating.`
            );
            safePhotoURL = null; // Discard invalid/huge URLs
        }

        game.players.push({
            uid: user.uid,
            name: user.name,
            photoURL: safePhotoURL,
            joinedAt: joinedAt,
        });
        // Guardar copia de datos del jugador
        game.formerPlayers[user.uid] = {
            name: user.name,
            photoURL: safePhotoURL,
        };
        // Solo inicializar puntuación si el jugador NO tiene puntos previos
        // Esto preserva puntos cuando un jugador se reconecta
        if (!game.playerScores.hasOwnProperty(user.uid)) {
            game.playerScores[user.uid] = 0;
        }
        // Actualizar orden base (OB)
        updatePlayerOrder(game);
    }
}

function removePlayer(game, userId) {
    const playerIsImpostor = game.impostorId === userId;
    const wasHost = game.hostId === userId;

    // CRITICAL: Guardar la fase ANTES de cualquier modificación
    const phaseBeforeRemoval = game.phase;

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
    if (game.eliminatedPlayers) {
        game.eliminatedPlayers = game.eliminatedPlayers.filter((uid) => uid !== userId);
    }
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

    // Si el impostor se va durante el juego, terminar la partida (amigos ganan)
    if (phaseBeforeRemoval === "playing" && playerIsImpostor) {
        const RoundManager = require("./RoundManager");
        console.log(`[Game ${game.gameId}] Impostor eliminado. Amigos ganan.`);
        RoundManager.endRound(game, true); // Amigos ganan - termina partida
        // NO verificar votos - el impostor se fue, se acabó
        return { newHostInfo, playerIsImpostor };
    }

    // CRITICAL FIX: Si estábamos en votación y el jugador NO era impostor,
    // verificar si los jugadores restantes ya completaron la votación
    if (phaseBeforeRemoval === "playing" && !playerIsImpostor) {
        const VotingManager = require("./VotingManager");
        console.log(
            `[Game ${game.gameId}] Jugador eliminado durante votación. Verificando si todos votaron...`
        );
        VotingManager.checkIfAllVoted(game);
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

    let startingPlayerId;

    // Si es la primera partida (no hay historial), empieza el host
    if (!game.lastStartingPlayerId) {
        startingPlayerId = game.hostId;
        console.log(`[Game ${game.gameId}] Primera partida: empieza el host`);
    } else {
        // Buscar el índice del último jugador que empezó
        const lastIndex = eligiblePlayers.indexOf(game.lastStartingPlayerId);

        if (lastIndex !== -1) {
            // Rotar al siguiente jugador (con wrap-around)
            const nextIndex = (lastIndex + 1) % eligiblePlayers.length;
            startingPlayerId = eligiblePlayers[nextIndex];
            console.log(
                `[Game ${game.gameId}] Rotación: de ${game.lastStartingPlayerId} a ${startingPlayerId}`
            );
        } else {
            // El jugador anterior no está disponible, buscar el siguiente válido
            // Encontrar su posición original en playerOrder
            const originalIndex = game.playerOrder.indexOf(game.lastStartingPlayerId);
            if (originalIndex !== -1) {
                // Buscar hacia adelante el primer jugador elegible
                for (let i = 1; i <= game.playerOrder.length; i++) {
                    const candidateIndex = (originalIndex + i) % game.playerOrder.length;
                    const candidateUid = game.playerOrder[candidateIndex];
                    if (eligiblePlayers.includes(candidateUid)) {
                        startingPlayerId = candidateUid;
                        console.log(
                            `[Game ${game.gameId}] Jugador anterior no disponible. Siguiente elegible: ${startingPlayerId}`
                        );
                        break;
                    }
                }
            }

            // Fallback final: el host
            if (!startingPlayerId) {
                startingPlayerId = game.hostId;
                console.log(`[Game ${game.gameId}] Fallback a host: ${startingPlayerId}`);
            }
        }
    }

    // Fallback: Si el jugador calculado no es elegible, usar el primero disponible
    if (!eligiblePlayers.includes(startingPlayerId)) {
        startingPlayerId = eligiblePlayers[0];
        console.log(
            `[Game ${game.gameId}] Jugador calculado no elegible. Usando primero: ${startingPlayerId}`
        );
    }

    const startingPlayer = game.players.find((p) => p.uid === startingPlayerId);
    console.log(
        `[Game ${game.gameId}] Ronda ${game.currentRound}: Jugador inicial = ${startingPlayer?.name}`
    );

    return startingPlayerId;
}

function getActivePlayers(game) {
    const eliminated = game.eliminatedPlayers || [];
    const roundPlayers = game.roundPlayers || [];
    return roundPlayers.filter((uid) => !eliminated.includes(uid));
}

module.exports = {
    addPlayer,
    removePlayer,
    updatePlayerOrder,
    calculateStartingPlayer,
    getActivePlayers,
};
