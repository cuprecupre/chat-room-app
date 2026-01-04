const roomManager = require("../services/roomManager");
const sessionManager = require("../services/sessionManager");
const statsManager = require("../services/statsManager");
const shutdownManager = require("../services/shutdownManager");

// Grace period constants
const MOBILE_GRACE_PERIOD = 300000; // 5 minutes for mobile users
const INACTIVE_GRACE_PERIOD = 60000; // 1 minute for inactive users

/**
 * Register all socket event handlers for a connection.
 */
function registerSocketHandlers(io, socket) {
    const user = socket.user;
    console.log(`User connected: ${user.name} (${user.uid})`);

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
    socket.on("create-game", (options) => handleCreateRoom(socket, user, options));
    socket.on("join-game", (roomId) => handleJoinRoom(io, socket, user, roomId));
    socket.on("start-game", (data) => {
        const roomId = typeof data === 'string' ? data : data.roomId;
        const options = typeof data === 'object' ? data.options : {};
        handleRoomAction(socket, user, roomId, (r) => r.startGame(user.uid, options));
    });
    socket.on("end-game", (roomId) =>
        handleRoomAction(socket, user, roomId, (r) => {
            if (r.currentGame) {
                r.currentGame.endGame(user.uid);
                r.onGameEnd();
            }
        })
    );
    socket.on("next-round", (roomId) =>
        handleRoomAction(socket, user, roomId, (r) => {
            if (r.currentGame) r.currentGame.continueToNextRound(user.uid);
        })
    );
    socket.on("play-again", (roomId) =>
        handleRoomAction(socket, user, roomId, (r) => r.playAgain(user.uid))
    );
    socket.on("update-options", ({ roomId, options }) =>
        handleRoomAction(socket, user, roomId, (r) => r.updateOptions(user.uid, options))
    );
    socket.on("cast-vote", (data) => handleCastVote(socket, user, data));
    socket.on("leave-game", (roomId, callback) =>
        handleLeaveRoom(io, socket, user, roomId, callback)
    );
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

    // Check if user is already in a room
    const existingRoom = roomManager.findUserRoom(user.uid);
    if (existingRoom) {
        socket.join(existingRoom.roomId);
        console.log(`User ${user.name} reconnected to room ${existingRoom.roomId}`);
        sessionManager.clearPendingDisconnect(user.uid);
        socket.emit("game-state", existingRoom.getStateFor(user.uid));
        return;
    }

    // Check if user has a pending disconnect
    const pending = sessionManager.getPendingDisconnect(user.uid);
    if (pending) {
        const pendingRoom = roomManager.getRoom(pending.gameId);
        if (pendingRoom && pendingRoom.players.some((p) => p.uid === user.uid)) {
            socket.join(pendingRoom.roomId);
            console.log(`User ${user.name} reconnected to pending room ${pendingRoom.roomId}`);
            sessionManager.clearPendingDisconnect(user.uid);
            socket.emit("game-state", pendingRoom.getStateFor(user.uid));
        } else {
            console.log(`User ${user.name} had pending disconnect but room/player no longer valid`);
            sessionManager.clearPendingDisconnect(user.uid);
            socket.emit("game-state", null);
        }
    }
}

/**
 * Handle room creation (renamed from handleCreateGame).
 */
async function handleCreateRoom(socket, user, options = {}) {
    const opts = (options && typeof options === 'object') ? options : {};
    // Block new room creation during shutdown
    if (shutdownManager.isShuttingDown) {
        return socket.emit(
            "error-message",
            "El servidor está en mantenimiento. No se pueden crear nuevas partidas."
        );
    }

    // Clean up ANY previous rooms the user might be in
    await roomManager.cleanupUserPreviousRooms(user.uid);

    const newRoom = roomManager.createRoom(user, opts);
    socket.join(newRoom.roomId);
    roomManager.emitRoomState(newRoom);
    statsManager.incrementGamesCreated();
    console.log(`Room created: ${newRoom.roomId} by ${user.name} with options:`, opts);
}

/**
 * Handle joining a room.
 */
async function handleJoinRoom(io, socket, user, roomId) {
    const roomToJoin = roomManager.getRoom(roomId);
    if (!roomToJoin) {
        return socket.emit("error-message", "La sala no existe.");
    }

    const isAlreadyInRoom = roomToJoin.players.some((p) => p.uid === user.uid);

    // Players CAN join a room during a game - they become late joiners
    // They'll wait in lobby_wait until the next game starts

    // Clean up ANY previous rooms the user might be in (except the one they are joining)
    await roomManager.cleanupUserPreviousRooms(user.uid, roomId);

    roomToJoin.addPlayer(user);
    socket.join(roomId);
    roomManager.emitRoomState(roomToJoin);

    // Cancel any pending cleanup for this room (player rejoined)
    roomManager.cancelEmptyRoomCleanup(roomId);

    console.log(`User ${user.name} joined room ${roomId}${roomToJoin.phase === 'playing' ? ' (late joiner)' : ''}`);
}

/**
 * Generic handler for room actions.
 */
function handleRoomAction(socket, user, roomId, action) {
    const room = roomManager.getRoom(roomId);
    if (!room) {
        return socket.emit("error-message", "La sala no existe.");
    }
    if (!room.players.some((p) => p.uid === user.uid)) {
        return socket.emit("error-message", "No perteneces a esta sala.");
    }
    try {
        action(room);
        roomManager.emitRoomState(room);
    } catch (error) {
        console.error(`Action failed for room ${roomId}:`, error.message);
        socket.emit("error-message", error.message);
    }
}
/**
 * Handle voting.
 * Votes go to the current Game within the Room.
 */
function handleCastVote(socket, user, { gameId, targetId }) {
    // gameId is actually roomId in new architecture
    const room = roomManager.getRoom(gameId);
    if (!room || !room.currentGame) {
        return socket.emit("error-message", "La partida no existe.");
    }
    const game = room.currentGame;
    if (!room.players.some((p) => p.uid === user.uid)) {
        return socket.emit("error-message", "No perteneces a esta sala.");
    }
    try {
        const { phaseChanged, allVoted } = game.castVote(user.uid, targetId);

        // Send full state when voting completes (phase change OR turn change)
        if (phaseChanged || allVoted) {
            // Check if game ended
            if (game.phase === "game_over") {
                room.onGameEnd();
            }
            roomManager.emitRoomState(room);
        } else {
            // Just a vote - send minimal update
            roomManager.emitVoteUpdate(room, user.uid, targetId);
        }
    } catch (error) {
        console.error(`Vote failed for room ${gameId}:`, error.message);
        socket.emit("error-message", error.message);
    }
}

/**
 * Handle explicit room leaving.
 */
function handleLeaveRoom(io, socket, user, roomId, callback) {
    const safeCallback = () => {
        if (typeof callback === "function") callback();
    };

    const room = roomManager.getRoom(roomId);
    if (!room || !room.players.some((p) => p.uid === user.uid)) {
        socket.emit("game-state", null);
        safeCallback();
        return;
    }

    console.log(`User ${user.name} is EXPLICITLY leaving room ${roomId}`);

    sessionManager.markExplicitlyLeft(user.uid);
    sessionManager.clearPendingDisconnect(user.uid);

    const { newHostInfo } = room.removePlayer(user.uid);

    // Reset leaving player state
    socket.emit("game-state", null);
    socket.leave(roomId);

    // Notify remaining players
    roomManager.emitRoomState(room);

    // Send toast notification
    if (room.players.length > 0) {
        if (newHostInfo) {
            roomManager.emitToast(
                roomId,
                `${user.name} ha abandonado. Ahora el anfitrión es ${newHostInfo.name}`
            );
            console.log(`[Host Transfer] ${user.name} abandonó. Nuevo host: ${newHostInfo.name}`);
        } else {
            roomManager.emitToast(roomId, `${user.name} ha abandonado el juego`);
        }
    } else {
        // Room is now empty - schedule for cleanup
        roomManager.scheduleEmptyRoomCleanup(roomId);
    }

    console.log(`User ${user.name} successfully left room ${roomId}`);
    safeCallback();
}

/**
 * Handle state request.
 */
function handleGetState(socket, user) {
    const userRoom = roomManager.findUserRoom(user.uid);
    socket.emit("game-state", userRoom ? userRoom.getStateFor(user.uid) : null);
}

/**
 * Handle disconnection.
 */
function handleDisconnect(io, socket, user) {
    console.log(`User disconnected: ${user.name}`);

    const userRoom = roomManager.findUserRoom(user.uid);
    if (userRoom) {
        const wasRecentlyActive = sessionManager.wasRecentlyActive(user.uid);
        const gracePeriod = wasRecentlyActive ? MOBILE_GRACE_PERIOD : INACTIVE_GRACE_PERIOD;
        const graceType = wasRecentlyActive ? "mobile lock detected" : "was already inactive";

        const userName = user.name;
        sessionManager.setPendingDisconnect(
            user.uid,
            userRoom.roomId,
            () => {
                const room = roomManager.getRoom(userRoom.roomId);
                if (!room) return;

                console.log(
                    `[Grace Expired] Removing user ${userName} from room ${userRoom.roomId}`
                );
                const { newHostInfo } = room.removePlayer(user.uid);
                roomManager.emitRoomState(room);

                if (room.players.length > 0) {
                    if (newHostInfo) {
                        roomManager.emitToast(
                            userRoom.roomId,
                            `${userName} se ha desconectado. Ahora el anfitrión es ${newHostInfo.name}`
                        );
                        console.log(
                            `[Host Transfer] ${userName} desconectado. Nuevo host: ${newHostInfo.name}`
                        );
                    } else {
                        roomManager.emitToast(userRoom.roomId, `${userName} se ha desconectado`);
                    }
                } else {
                    // Room is now empty - schedule for cleanup
                    roomManager.scheduleEmptyRoomCleanup(userRoom.roomId);
                }
            },
            gracePeriod
        );

        console.log(
            `[Disconnect] Grace timer started for user ${user.name} in room ${userRoom.roomId} (${graceType})`
        );
    }

    sessionManager.removeUserSocket(user.uid, socket.id);
    sessionManager.removeHeartbeat(user.uid);
}

module.exports = { registerSocketHandlers };
