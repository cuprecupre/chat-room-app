const gameManager = require("../services/gameManager");
const sessionManager = require("../services/sessionManager");
const statsManager = require("../services/statsManager");

// Grace period constants
const MOBILE_GRACE_PERIOD = 300000; // 5 minutes for mobile users
const INACTIVE_GRACE_PERIOD = 60000; // 1 minute for inactive users

/**
 * Register all socket event handlers for a connection.
 */
function registerSocketHandlers(io, socket) {
    const user = socket.user;
    console.log(`User connected: ${user.name} (${user.uid})`);

    // Emit server boot time to client for update detection
    socket.emit("boot-time", statsManager.stats.serverStartTime);

    // Track stats
    statsManager.incrementConnections();
    statsManager.updatePeakUsers();

    // Handle multiple sessions: disconnect old socket if exists
    const oldSocketId = sessionManager.getUserSocket(user.uid);
    if (oldSocketId) {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
            console.log(`Disconnecting old session for user ${user.name}`);
            oldSocket.emit(
                "session-replaced",
                "Tu sesión ha sido reemplazada por una nueva pestaña"
            );
            oldSocket.disconnect(true);
        }
    }

    sessionManager.setUserSocket(user.uid, socket.id);
    sessionManager.initHeartbeat(user.uid);

    // Handle reconnection logic
    handleReconnection(socket, user);

    // Register event handlers
    socket.on("create-game", (options) => handleCreateGame(socket, user, options));
    socket.on("join-game", (gameId) => handleJoinGame(io, socket, user, gameId));
    socket.on("start-game", (gameId) =>
        handleGameAction(socket, user, gameId, (g) => g.startGame(user.uid))
    );
    socket.on("end-game", (gameId) =>
        handleGameAction(socket, user, gameId, (g) => g.endGame(user.uid))
    );
    socket.on("next-round", (gameId) =>
        handleGameAction(socket, user, gameId, (g) => g.continueToNextRound(user.uid))
    );
    socket.on("play-again", (gameId) =>
        handleGameAction(socket, user, gameId, (g) => g.playAgain(user.uid))
    );
    socket.on("cast-vote", (data) => handleCastVote(socket, user, data));
    socket.on("leave-game", (gameId, callback) =>
        handleLeaveGame(io, socket, user, gameId, callback)
    );
    socket.on("migrate-game", (gameId) => handleMigrateGame(io, socket, user, gameId));
    socket.on("get-state", () => handleGetState(socket, user));
    socket.on("heartbeat", () => sessionManager.updateHeartbeat(user.uid));
    socket.on("disconnect", () => handleDisconnect(io, socket, user));
}

/**
 * Handle user reconnection scenarios.
 */
function handleReconnection(socket, user) {
    // Check if user explicitly left - don't auto-rejoin
    if (sessionManager.hasExplicitlyLeft(user.uid)) {
        console.log(`User ${user.name} recently left explicitly - NOT auto-rejoining`);
        sessionManager.clearExplicitlyLeft(user.uid);
        socket.emit("game-state", null);
        sessionManager.clearPendingDisconnect(user.uid);
        return;
    }

    // Check if user is already in a game
    const existingGame = gameManager.findUserGame(user.uid);
    if (existingGame) {
        socket.join(existingGame.gameId);
        console.log(`User ${user.name} reconnected to game ${existingGame.gameId}`);
        sessionManager.clearPendingDisconnect(user.uid);
        socket.emit("game-state", existingGame.getStateFor(user.uid));
        return;
    }

    // Check if user has a pending disconnect
    const pending = sessionManager.getPendingDisconnect(user.uid);
    if (pending) {
        const pendingGame = gameManager.getGame(pending.gameId);
        if (pendingGame && pendingGame.players.some((p) => p.uid === user.uid)) {
            socket.join(pendingGame.gameId);
            console.log(`User ${user.name} reconnected to pending game ${pendingGame.gameId}`);
            sessionManager.clearPendingDisconnect(user.uid);
            socket.emit("game-state", pendingGame.getStateFor(user.uid));
        } else {
            console.log(`User ${user.name} had pending disconnect but game/player no longer valid`);
            sessionManager.clearPendingDisconnect(user.uid);
            socket.emit("game-state", null);
        }
    }
}

/**
 * Handle game creation.
 */
async function handleCreateGame(socket, user, options = {}) {
    // Clean up ANY previous games the user might be in (ghost busting 👻)
    await gameManager.cleanupUserPreviousGames(user.uid);

    const newGame = gameManager.createGame(user, options);
    socket.join(newGame.gameId);
    gameManager.emitGameState(newGame);
    statsManager.incrementGamesCreated();
    console.log(`Game created: ${newGame.gameId} by ${user.name} with options:`, options);
}

/**
 * Handle joining a game.
 */
async function handleJoinGame(io, socket, user, gameId) {
    const gameToJoin = gameManager.getGame(gameId);
    if (!gameToJoin) {
        return socket.emit("error-message", "La partida no existe.");
    }

    const isAlreadyInGame = gameToJoin.players.some((p) => p.uid === user.uid);
    if (gameToJoin.phase === "playing" && !isAlreadyInGame) {
        return socket.emit("error-message", "No puedes unirte a una partida en curso.");
    }

    // Clean up ANY previous games the user might be in (except the one they are joining)
    await gameManager.cleanupUserPreviousGames(user.uid, gameId);

    gameToJoin.addPlayer(user);
    socket.join(gameId);
    gameManager.emitGameState(gameToJoin);

    // Cancel any pending cleanup for this game (player rejoined)
    gameManager.cancelEmptyGameCleanup(gameId);

    console.log(`User ${user.name} joined game ${gameId}`);
}

/**
 * Generic handler for game actions.
 */
function handleGameAction(socket, user, gameId, action) {
    const game = gameManager.getGame(gameId);
    if (!game) {
        return socket.emit("error-message", "La partida no existe.");
    }
    if (!game.players.some((p) => p.uid === user.uid)) {
        return socket.emit("error-message", "No perteneces a esta partida.");
    }
    try {
        action(game);
        gameManager.emitGameState(game);
    } catch (error) {
        console.error(`Action failed for game ${gameId}:`, error.message);
        socket.emit("error-message", error.message);
    }
}
/**
 * Handle voting.
 * Optimized: sends minimal vote updates during voting, full state only when voting completes.
 */
function handleCastVote(socket, user, { gameId, targetId }) {
    const game = gameManager.getGame(gameId);
    if (!game) {
        return socket.emit("error-message", "La partida no existe.");
    }
    if (!game.players.some((p) => p.uid === user.uid)) {
        return socket.emit("error-message", "No perteneces a esta partida.");
    }
    try {
        const { phaseChanged, allVoted } = game.castVote(user.uid, targetId);

        // Send full state when voting completes (phase change OR turn change)
        // This ensures clients receive currentTurn updates for turn transitions
        if (phaseChanged || allVoted) {
            gameManager.emitGameState(game);
        } else {
            // Just a vote - send minimal update (~100x less data)
            gameManager.emitVoteUpdate(game, user.uid, targetId);
        }
    } catch (error) {
        console.error(`Vote failed for game ${gameId}:`, error.message);
        socket.emit("error-message", error.message);
    }
}

/**
 * Handle explicit game leaving.
 */
function handleLeaveGame(io, socket, user, gameId, callback) {
    const safeCallback = () => {
        if (typeof callback === "function") callback();
    };

    const game = gameManager.getGame(gameId);
    if (!game || !game.players.some((p) => p.uid === user.uid)) {
        socket.emit("game-state", null);
        safeCallback();
        return;
    }

    console.log(`User ${user.name} is EXPLICITLY leaving game ${gameId}`);

    sessionManager.markExplicitlyLeft(user.uid);
    sessionManager.clearPendingDisconnect(user.uid);

    const newHostInfo = game.removePlayer(user.uid);

    // Reset leaving player state
    socket.emit("game-state", null);
    socket.leave(gameId);

    // Notify remaining players
    gameManager.emitGameState(game);

    // Send toast notification
    if (game.players.length > 0) {
        if (newHostInfo) {
            gameManager.emitToast(
                gameId,
                `${user.name} ha abandonado. Ahora el anfitrión es ${newHostInfo.name}`
            );
            console.log(`[Host Transfer] ${user.name} abandonó. Nuevo host: ${newHostInfo.name}`);
        } else {
            gameManager.emitToast(gameId, `${user.name} ha abandonado el juego`);
        }
    } else {
        // Game is now empty - schedule for cleanup
        gameManager.scheduleEmptyGameCleanup(gameId);
    }

    console.log(`User ${user.name} successfully left game ${gameId}`);
    safeCallback();
}

/**
 * Handle game migration (for old system games).
 * Creates a new game and moves all players to it.
 */
async function handleMigrateGame(io, socket, user, oldGameId) {
    const oldGame = gameManager.getGame(oldGameId);
    if (!oldGame) {
        return socket.emit("error-message", "La partida no existe.");
    }

    if (oldGame.phase !== "needs_migration") {
        return socket.emit("error-message", "Esta partida no necesita migración.");
    }

    // Solo el host puede migrar
    if (oldGame.hostId !== user.uid) {
        return socket.emit("error-message", "Solo el anfitrión puede migrar la partida.");
    }

    const playersList = oldGame.players.map((p) => p.name).join(", ");
    console.log(`[Migration] Starting migration for game ${oldGameId}`);
    console.log(`[Migration]   - Players to migrate: ${playersList}`);

    // Limpiar sesiones fantasma del HOST (excepto la partida actual de migración)
    await gameManager.cleanupUserPreviousGames(user.uid, oldGameId);

    // Crear nueva partida con el host
    const newGame = gameManager.createGame(user, { showImpostorHint: oldGame.showImpostorHint });
    console.log(`[Migration]   - New game created: ${newGame.gameId}`);

    // Mover al host a la nueva partida
    socket.leave(oldGameId);
    socket.join(newGame.gameId);
    console.log(`[Migration]   - Host ${user.name} moved to new game`);

    // Mover a todos los demás jugadores
    const otherPlayers = oldGame.players.filter((p) => p.uid !== user.uid);
    for (const player of otherPlayers) {
        // Limpiar sesiones fantasma del JUGADOR (excepto oldGameId)
        await gameManager.cleanupUserPreviousGames(player.uid, oldGameId);

        // Añadir a la nueva partida
        newGame.addPlayer(player);

        // Obtener el socket del jugador y moverlo
        const playerSocketId = sessionManager.getUserSocket(player.uid);
        if (playerSocketId) {
            const playerSocket = io.sockets.sockets.get(playerSocketId);
            if (playerSocket) {
                playerSocket.leave(oldGameId);
                playerSocket.join(newGame.gameId);
                console.log(`[Migration]   - Player ${player.name} moved to new game`);
            } else {
                console.log(
                    `[Migration]   ⚠️ Player ${player.name} socket not found in io.sockets`
                );
            }
        } else {
            console.log(`[Migration]   ⚠️ Player ${player.name} socket ID not found`);
        }
    }

    // Limpiar la partida vieja de memoria
    oldGame.players = [];
    delete gameManager.games[oldGameId];

    // IMPORTANTE: Borrar la partida vieja de Firestore para evitar que usuarios queden asociados
    const dbService = require("../services/db");
    dbService
        .deleteGameState(oldGameId)
        .then(() => {
            console.log(`[Migration]   - Old game ${oldGameId} deleted from Firestore`);
        })
        .catch((err) => {
            console.error(
                `[Migration]   ⚠️ Failed to delete old game from Firestore:`,
                err.message
            );
        });

    console.log(
        `[Migration] ✅ Migration complete: ${oldGameId} → ${newGame.gameId} (${newGame.players.length} players)`
    );

    // Emitir estado nuevo a todos los jugadores en la nueva room
    gameManager.emitGameState(newGame);
    statsManager.incrementGamesCreated();
}

/**
 * Handle state request.
 */
function handleGetState(socket, user) {
    const userGame = gameManager.findUserGame(user.uid);
    socket.emit("game-state", userGame ? userGame.getStateFor(user.uid) : null);
}

/**
 * Handle disconnection.
 */
function handleDisconnect(io, socket, user) {
    console.log(`User disconnected: ${user.name}`);

    const userGame = gameManager.findUserGame(user.uid);
    if (userGame) {
        const wasRecentlyActive = sessionManager.wasRecentlyActive(user.uid);
        const gracePeriod = wasRecentlyActive ? MOBILE_GRACE_PERIOD : INACTIVE_GRACE_PERIOD;
        const graceType = wasRecentlyActive ? "mobile lock detected" : "was already inactive";

        const userName = user.name;
        sessionManager.setPendingDisconnect(
            user.uid,
            userGame.gameId,
            () => {
                const g = gameManager.getGame(userGame.gameId);
                if (!g) return;

                console.log(
                    `[Grace Expired] Removing user ${userName} from game ${userGame.gameId}`
                );
                const newHostInfo = g.removePlayer(user.uid);
                gameManager.emitGameState(g);

                if (g.players.length > 0) {
                    if (newHostInfo) {
                        gameManager.emitToast(
                            userGame.gameId,
                            `${userName} se ha desconectado. Ahora el anfitrión es ${newHostInfo.name}`
                        );
                        console.log(
                            `[Host Transfer] ${userName} desconectado. Nuevo host: ${newHostInfo.name}`
                        );
                    } else {
                        gameManager.emitToast(userGame.gameId, `${userName} se ha desconectado`);
                    }
                } else {
                    // Game is now empty - schedule for cleanup
                    gameManager.scheduleEmptyGameCleanup(userGame.gameId);
                }
            },
            gracePeriod
        );

        console.log(
            `[Disconnect] Grace timer started for user ${user.name} in game ${userGame.gameId} (${graceType})`
        );
    }

    sessionManager.removeUserSocket(user.uid, socket.id);
    sessionManager.removeHeartbeat(user.uid);
}

module.exports = { registerSocketHandlers };
