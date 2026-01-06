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
    socket.on("create-room", (options) => handleCreateRoom(socket, user, options));
    socket.on("join-room", (roomId) => handleJoinRoom(io, socket, user, roomId));
    socket.on("start-match", (data) => {
        const roomId = typeof data === 'string' ? data : data.roomId;
        const options = typeof data === 'object' ? data.options : {};
        handleRoomAction(socket, user, roomId, (r) => r.startMatch(user.uid, options));
    });
    socket.on("end-match", (roomId) =>
        handleRoomAction(socket, user, roomId, (r) => {
            if (r.currentMatch) {
                r.currentMatch.endMatch(user.uid);
                r.onMatchEnd();
            }
        })
    );
    socket.on("next-round", (roomId) =>
        handleRoomAction(socket, user, roomId, (r) => {
            if (r.currentMatch) r.currentMatch.continueToNextRound(user.uid);
        })
    );
    socket.on("play-again", (roomId) =>
        handleRoomAction(socket, user, roomId, (r) => r.playAgain(user.uid))
    );
    socket.on("update-options", ({ roomId, options }) =>
        handleRoomAction(socket, user, roomId, (r) => r.updateOptions(user.uid, options))
    );
    socket.on("cast-vote", (data) => handleCastVote(socket, user, data));

    // NEW handles for terminology
    socket.on("leave-match", (roomId, callback) =>
        handleLeaveMatch(io, socket, user, roomId, callback)
    );
    socket.on("leave-room", (roomId, callback) =>
        handleLeaveRoom(io, socket, user, roomId, callback)
    );
    socket.on("kick-player", ({ roomId, targetId }) =>
        handleKickPlayer(io, socket, user, roomId, targetId)
    );

    // ============================================
    // LEGACY ALIASES (Transition Period Support)
    // ============================================
    socket.on("join-game", (gameId) => handleJoinRoom(io, socket, user, gameId));
    socket.on("leave-game", (gameId, callback) => handleLeaveRoom(io, socket, user, gameId, callback));
    socket.on("start-game", (data) => {
        const id = typeof data === 'string' ? data : (data.gameId || data.roomId);
        const options = typeof data === 'object' ? data.options : {};
        handleRoomAction(socket, user, id, (r) => r.startMatch(user.uid, options));
    });
    socket.on("end-game", (gameId) =>
        handleRoomAction(socket, user, gameId, (r) => {
            if (r.currentMatch) {
                r.currentMatch.endMatch(user.uid);
                r.onMatchEnd();
            }
        })
    );
    socket.on("create-game", (options) => handleCreateRoom(socket, user, options));

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
        const pendingRoom = roomManager.getRoom(pending.roomId);
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
function handleRoomAction(socket, user, data, action) {
    const roomId = typeof data === 'string' ? data : (data?.roomId || data?.gameId);
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
 * Votes go to the current Match within the Room.
 */
function handleCastVote(socket, user, { roomId, matchId, gameId, targetId }) {
    // roomId is preferred to find the instance, fallback to gameId or matchId for compatibility
    const idToSearch = roomId || gameId || matchId;
    const room = roomManager.getRoom(idToSearch);
    if (!room || !room.currentMatch) {
        return socket.emit("error-message", "La partida no existe.");
    }
    const match = room.currentMatch;
    if (!room.players.some((p) => p.uid === user.uid)) {
        return socket.emit("error-message", "No perteneces a esta sala.");
    }
    try {
        const { phaseChanged, allVoted } = match.castVote(user.uid, targetId);

        // Send full state when voting completes (phase change OR turn change)
        if (phaseChanged || allVoted) {
            // Check if match ended
            if (match.phase === "game_over") {
                room.onMatchEnd();
            }
            roomManager.emitRoomState(room);
        } else {
            // Just a vote - send minimal update
            roomManager.emitVoteUpdate(room, user.uid, targetId);
        }
    } catch (error) {
        console.error(`Vote failed for room ${roomId}:`, error.message);
        socket.emit("error-message", error.message);
    }
}

/**
 * Handle quitting the current match but staying in the room.
 */
function handleLeaveMatch(io, socket, user, roomId, callback) {
    const safeCallback = () => {
        if (typeof callback === "function") callback();
    };

    const room = roomManager.getRoom(roomId);
    if (!room || !room.players.some((p) => p.uid === user.uid)) {
        safeCallback();
        return;
    }

    console.log(`User ${user.name} is leaving the MATCH but staying in ROOM ${roomId}`);

    const result = room.leaveMatch(user.uid);

    // Emit current state (will be host_cancelled if host left)
    roomManager.emitRoomState(room);

    if (result && result.hostCancelled) {
        // Host cancelled the match - show special toast
        roomManager.emitToast(roomId, `El anfitrión ha abandonado la partida`);
        console.log(`[Room ${roomId}] Host cancelled match. Farewell screen showing for all players.`);

        // Schedule lobby state emission after 5 seconds to sync clients
        setTimeout(() => {
            const freshRoom = roomManager.getRoom(roomId);
            if (freshRoom && freshRoom.phase === "lobby") {
                roomManager.emitRoomState(freshRoom);
                console.log(`[Room ${roomId}] Emitted lobby state after host_cancelled timeout.`);
            }
        }, 5000);
    } else {
        roomManager.emitToast(roomId, `${user.name} ha vuelto a la sala`);
    }

    console.log(`User ${user.name} successfully left match in room ${roomId}`);
    safeCallback();
}

/**
 * Handle explicit room leaving (quitting entirely).
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
        // Room is now empty - schedule for cleanup immediately
        roomManager.scheduleEmptyRoomCleanup(roomId, 0);
    }

    console.log(`User ${user.name} successfully left room ${roomId}`);
    safeCallback();
}

/**
 * Handle host kicking a player from the room.
 */
function handleKickPlayer(io, socket, user, roomId, targetId) {
    const room = roomManager.getRoom(roomId);
    if (!room) {
        socket.emit("error", { message: "Sala no encontrada" });
        return;
    }

    try {
        const result = room.kickPlayer(user.uid, targetId);

        // Find the kicked player's socket and notify them
        const targetSocketId = sessionManager.getUserSocket(targetId);
        if (targetSocketId) {
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.emit("kicked", {
                    message: "Has sido expulsado de la sala por el anfitrión"
                });
                targetSocket.emit("game-state", null);
                targetSocket.leave(roomId);
            }
        }

        // Clear session data for kicked player
        sessionManager.clearPendingDisconnect(targetId);

        // Emit updated room state to remaining players
        roomManager.emitRoomState(room);

        // Notify remaining players
        roomManager.emitToast(roomId, `${result.kickedPlayer.name} ha sido expulsado de la sala`);

        console.log(`[Room ${roomId}] Player ${result.kickedPlayer.name} kicked by host ${user.name}`);

    } catch (error) {
        socket.emit("error", { message: error.message });
        console.error(`[Room ${roomId}] Kick error: ${error.message}`);
    }
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
    const currentSocketId = sessionManager.getUserSocket(user.uid);

    // If there's already a new socket for this user, don't start a grace timer
    // We only care about disconnections of the CURRENT active session
    if (currentSocketId && currentSocketId !== socket.id) {
        console.log(`[Disconnect] Ignoring ${user.name} disconnect (session replaced)`);
        sessionManager.removeUserSocket(user.uid, socket.id);
        sessionManager.removeHeartbeat(user.uid);
        return;
    }

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
                    // Room is now empty - schedule for cleanup immediately
                    roomManager.scheduleEmptyRoomCleanup(userRoom.roomId, 0);
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
