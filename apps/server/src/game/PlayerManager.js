const { cleanProfanity } = require("../utils/profanityFilter");

function addPlayer(match, user) {
    const existingPlayer = match.players.find((p) => p.uid === user.uid);

    // Sanitize photoURL to avoid massive Base64 strings causing DB/Socket lag
    let safePhotoURL = user.photoURL || null;
    if (safePhotoURL && safePhotoURL.length > 500) {
        console.warn(
            `[PlayerManager] Warning: PhotoURL for ${user.uid} is too long (${safePhotoURL.length} chars). Truncating.`
        );
        safePhotoURL = null; // Discard invalid/huge URLs
    }

    if (existingPlayer) {
        // Update existing player info
        existingPlayer.name = user.name ? cleanProfanity(user.name) : existingPlayer.name;
        existingPlayer.photoURL = safePhotoURL || existingPlayer.photoURL;

        // Also update formerPlayers copy
        match.formerPlayers[user.uid] = {
            name: existingPlayer.name,
            photoURL: existingPlayer.photoURL,
        };
        return;
    }

    const joinedAt = Date.now();
    match.players.push({
        uid: user.uid,
        name: cleanProfanity(user.name),
        photoURL: safePhotoURL,
        joinedAt: joinedAt,
    });
    // Guardar copia de datos del jugador
    match.formerPlayers[user.uid] = {
        name: cleanProfanity(user.name),
        photoURL: safePhotoURL,
    };
    // Solo inicializar puntuación si el jugador NO tiene puntos previos
    // Esto preserva puntos cuando un jugador se reconecta
    if (!match.playerScores.hasOwnProperty(user.uid)) {
        match.playerScores[user.uid] = 0;
    }
    // Actualizar orden base (OB)
    updatePlayerOrder(match);
}

function removePlayer(match, userId) {
    const playerIsImpostor = match.impostorId === userId;
    const wasHost = match.hostId === userId;

    // CRITICAL: Guardar la fase ANTES de cualquier modificación
    const phaseBeforeRemoval = match.phase;

    // Guardar datos del jugador antes de eliminarlo
    const leavingPlayer = match.players.find((p) => p.uid === userId);
    if (leavingPlayer) {
        match.formerPlayers[userId] = {
            name: leavingPlayer.name,
            photoURL: leavingPlayer.photoURL || null,
        };
    }

    match.players = match.players.filter((p) => p.uid !== userId);
    match.roundPlayers = match.roundPlayers.filter((uid) => uid !== userId);
    if (match.eliminatedPlayers) {
        match.eliminatedPlayers = match.eliminatedPlayers.filter((uid) => uid !== userId);
    }
    delete match.votes[userId];

    // Actualizar orden base cuando un jugador se va
    updatePlayerOrder(match);

    // Transferir host si el que se fue era el host
    let newHostInfo = null;
    if (wasHost && match.players.length > 0) {
        const nextHostId = match.playerOrder.find((uid) => match.players.some((p) => p.uid === uid));
        if (nextHostId) {
            match.hostId = nextHostId;
            const newHost = match.players.find((p) => p.uid === nextHostId);
            newHostInfo = {
                uid: nextHostId,
                name: newHost ? newHost.name : "Jugador",
            };
            console.log(
                `[Match ${match.matchId}] Host transferido a ${newHostInfo.name} (${nextHostId})`
            );
        }
    }

    // Si el impostor se va durante el juego, terminar la partida (amigos ganan)
    if (phaseBeforeRemoval === "playing" && playerIsImpostor) {
        const RoundManager = require("./RoundManager");
        console.log(`[Match ${match.matchId}] Impostor eliminado. Amigos ganan.`);
        RoundManager.endRound(match, true); // Amigos ganan - termina partida
        // NO verificar votos - el impostor se fue, se acabó
        return { newHostInfo, playerIsImpostor };
    }

    // NUEVO: Verificar si quedan menos de 3 jugadores activos durante partida
    if ((phaseBeforeRemoval === "playing" || phaseBeforeRemoval === "clue_round") && !playerIsImpostor) {
        const activePlayers = match.roundPlayers.filter((uid) =>
            !match.eliminatedPlayers.includes(uid)
        );

        if (activePlayers.length < 3) {
            const ScoringManager = require("./ScoringManager");
            console.log(`[Match ${match.matchId}] Menos de 3 jugadores activos (${activePlayers.length}). Impostor gana por abandono.`);

            // Give impostor survival points for current round
            ScoringManager.giveImpostorSurvivalPoints(match);
            // Give impostor max bonus points
            ScoringManager.giveImpostorMaxPoints(match);

            // Force game over with impostor winning
            match.winnerId = match.impostorId;
            match.phase = "game_over";
            match.persistAnalytics("impostor_survived");

            return { newHostInfo, playerIsImpostor, matchEnded: true };
        }
    }

    // CRITICAL FIX: Si estábamos en votación y el jugador NO era impostor,
    // verificar si los jugadores restantes ya completaron la votación
    if (phaseBeforeRemoval === "playing" && !playerIsImpostor) {
        const VotingManager = require("./VotingManager");
        VotingManager.checkIfAllVoted(match);
    }

    return { newHostInfo, playerIsImpostor };
}

function updatePlayerOrder(match) {
    const sortedPlayers = [...match.players].sort((a, b) => {
        return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
    match.playerOrder = sortedPlayers.map((p) => p.uid);
}

function calculateStartingPlayer(match) {
    const eligiblePlayers = match.playerOrder.filter((uid) => match.roundPlayers.includes(uid));

    if (eligiblePlayers.length === 0) {
        return null;
    }

    let startingPlayerId;

    // Si es la primera partida (no hay historial), empieza el host
    if (!match.lastStartingPlayerId) {
        startingPlayerId = match.hostId;
    } else {
        // Buscar el índice del último jugador que empezó
        const lastIndex = eligiblePlayers.indexOf(match.lastStartingPlayerId);

        if (lastIndex !== -1) {
            // Rotar al siguiente jugador (con wrap-around)
            const nextIndex = (lastIndex + 1) % eligiblePlayers.length;
            startingPlayerId = eligiblePlayers[nextIndex];
        } else {
            // El jugador anterior no está disponible, buscar el siguiente válido
            // Encontrar su posición original en playerOrder
            const originalIndex = match.playerOrder.indexOf(match.lastStartingPlayerId);
            if (originalIndex !== -1) {
                // Buscar hacia adelante el primer jugador elegible
                for (let i = 1; i <= match.playerOrder.length; i++) {
                    const candidateIndex = (originalIndex + i) % match.playerOrder.length;
                    const candidateUid = match.playerOrder[candidateIndex];
                    if (eligiblePlayers.includes(candidateUid)) {
                        startingPlayerId = candidateUid;
                        break;
                    }
                }
            }

            // Fallback final: el host
            if (!startingPlayerId) {
                startingPlayerId = match.hostId;
            }
        }
    }

    // Fallback: Si el jugador calculado no es elegible, usar el primero disponible
    if (!eligiblePlayers.includes(startingPlayerId)) {
        startingPlayerId = eligiblePlayers[0];
    }

    return startingPlayerId;
}

function getActivePlayers(match) {
    const eliminated = match.eliminatedPlayers || [];
    const roundPlayers = match.roundPlayers || [];
    return roundPlayers.filter((uid) => !eliminated.includes(uid));
}

module.exports = {
    addPlayer,
    removePlayer,
    updatePlayerOrder,
    calculateStartingPlayer,
    getActivePlayers,
};
