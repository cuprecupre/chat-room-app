const Room = require("../Room");
const sessionManager = require("./sessionManager");

/**
 * RoomManager - Manages Room instances and state broadcasting.
 * 
 * Replaces GameManager for the new Room-based architecture.
 * Rooms persist across multiple Games (matches).
 */
class RoomManager {
    constructor() {
        // { [roomId]: Room instance }
        this.rooms = {};
        // Socket.IO instance
        this.io = null;
        // Track pending room deletions
        this.pendingDeletions = {};
    }

    /**
     * Initialize with Socket.IO instance.
     */
    initialize(io) {
        this.io = io;
    }

    /**
     * Create a new Room.
     */
    createRoom(user, options = {}) {
        const opts = (options && typeof options === 'object') ? options : {};
        const room = new Room(user, opts);
        this.rooms[room.roomId] = room;
        console.log(`[RoomManager] Created room ${room.roomId} by ${user.name}`);
        return room;
    }

    /**
     * Get a Room by ID.
     */
    getRoom(roomId) {
        return this.rooms[roomId];
    }

    /**
     * Find which Room a user belongs to.
     */
    findUserRoom(userId) {
        return Object.values(this.rooms).find(r =>
            r.players.some(p => p.uid === userId)
        );
    }

    /**
     * Check if user is in a specific Room.
     */
    isUserInRoom(userId, roomId) {
        const room = this.rooms[roomId];
        return room && room.players.some(p => p.uid === userId);
    }

    /**
     * Cleanup user from any other Rooms (One User, One Room policy).
     */
    async cleanupUserPreviousRooms(userId, excludeRoomId = null) {
        const roomsToRemove = Object.values(this.rooms).filter(
            r => r.roomId !== excludeRoomId && r.players.some(p => p.uid === userId)
        );

        if (roomsToRemove.length === 0) return;

        console.log(`[RoomManager] Removing user ${userId} from ${roomsToRemove.length} previous rooms`);

        for (const room of roomsToRemove) {
            room.removePlayer(userId);

            if (room.players.length === 0) {
                this.scheduleEmptyRoomCleanup(room.roomId, 1000);
            } else {
                this.emitRoomState(room);
            }
        }
    }

    /**
     * Broadcast room/game state to all players.
     */
    emitRoomState(room) {
        if (!this.io) {
            console.error("[RoomManager] Socket.IO not initialized");
            return;
        }

        room.players.forEach(p => {
            const playerSocketId = sessionManager.getUserSocket(p.uid);
            if (playerSocketId) {
                this.io.to(playerSocketId).emit("game-state", room.getStateFor(p.uid));
            }
        });
    }

    /**
     * Emit minimal vote update (delegated to current match).
     */
    emitVoteUpdate(room, voterId, targetId) {
        if (!this.io || !room.currentMatch) return;

        const match = room.currentMatch;
        const votedPlayers = Object.keys(match.votes);
        const eliminated = match.eliminatedPlayers || [];
        const roundPlayers = match.roundPlayers || [];
        const activePlayers = roundPlayers.filter(uid => !eliminated.includes(uid));

        room.players.forEach(p => {
            const playerSocketId = sessionManager.getUserSocket(p.uid);
            if (playerSocketId) {
                this.io.to(playerSocketId).emit("vote-update", {
                    votedPlayers,
                    myVote: match.votes[p.uid] || null,
                    hasVoted: match.votes.hasOwnProperty(p.uid),
                    activePlayers,
                });
            }
        });
    }

    /**
     * Send toast to all players in a room.
     */
    emitToast(roomId, message) {
        if (!this.io) return;
        this.io.to(roomId).emit("toast", message);
    }

    /**
     * Notify specific users that their stats have been updated.
     * @param {string[]} uids - Array of user IDs to notify
     */
    emitStatsUpdated(uids) {
        if (!this.io) return;
        uids.forEach(uid => {
            const socketId = sessionManager.getUserSocket(uid);
            if (socketId) {
                this.io.to(socketId).emit("stats-updated");
            }
        });
    }

    /**
     * Get all rooms (debug/admin).
     */
    getAllRooms() {
        return this.rooms;
    }

    /**
     * Get count of active rooms.
     */
    getRoomCount() {
        return Object.keys(this.rooms).length;
    }

    /**
     * Schedule empty room cleanup.
     */
    scheduleEmptyRoomCleanup(roomId, delayMs = 5 * 60 * 1000) {
        if (this.pendingDeletions[roomId]) {
            clearTimeout(this.pendingDeletions[roomId]);
            delete this.pendingDeletions[roomId];
        }

        const room = this.rooms[roomId];
        if (!room || room.players.length > 0) return;

        console.log(`⏳ [RoomManager] Empty room ${roomId} scheduled for deletion in ${delayMs / 1000}s`);

        const timeoutId = setTimeout(() => {
            const currentRoom = this.rooms[roomId];

            if (!currentRoom) {
                delete this.pendingDeletions[roomId];
                return;
            }

            if (currentRoom.players.length > 0) {
                console.log(`[RoomManager] Room ${roomId} has players, cancelling deletion`);
                delete this.pendingDeletions[roomId];
                return;
            }

            delete this.rooms[roomId];
            delete this.pendingDeletions[roomId];
            console.log(`🗑️ [RoomManager] Removed empty room ${roomId}`);
        }, delayMs);

        this.pendingDeletions[roomId] = timeoutId;
    }

    /**
     * Cancel scheduled room deletion.
     */
    cancelEmptyRoomCleanup(roomId) {
        if (this.pendingDeletions[roomId]) {
            clearTimeout(this.pendingDeletions[roomId]);
            delete this.pendingDeletions[roomId];
            console.log(`✅ [RoomManager] Cancelled deletion for room ${roomId}`);
        }
    }
}

// Export singleton
module.exports = new RoomManager();
