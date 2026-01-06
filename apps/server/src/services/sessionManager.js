/**
 * SessionManager - Manages user sessions, heartbeats, and disconnection handling.
 * Singleton service for tracking connected users across the application.
 */
class SessionManager {
    constructor() {
        // { [userId]: socketId }
        this.userSockets = {};
        // { [userId]: { lastSeen: timestamp, timeout: timeoutId } }
        this.userHeartbeats = {};
        // { [uid]: { timeout: timeoutId, roomId: string } }
        this.pendingDisconnects = {};
        // { [uid]: true } - Users who explicitly left games
        this.explicitlyLeftUsers = {};
    }

    /**
     * Register a user's socket connection.
     */
    setUserSocket(userId, socketId) {
        this.userSockets[userId] = socketId;
    }

    /**
     * Get a user's current socket ID.
     */
    getUserSocket(userId) {
        return this.userSockets[userId];
    }

    /**
     * Remove a user's socket mapping.
     */
    removeUserSocket(userId, socketId) {
        // Only delete if this is the current socket (not replaced by new connection)
        if (this.userSockets[userId] === socketId) {
            delete this.userSockets[userId];
        }
    }

    /**
     * Initialize heartbeat tracking for a user.
     */
    initHeartbeat(userId) {
        this.userHeartbeats[userId] = {
            lastSeen: Date.now(),
            timeout: null,
        };
    }

    /**
     * Update heartbeat for a user (called when heartbeat event received).
     */
    updateHeartbeat(userId) {
        if (!this.userHeartbeats[userId]) return;

        this.userHeartbeats[userId].lastSeen = Date.now();

        // Clear any existing timeout
        if (this.userHeartbeats[userId].timeout) {
            clearTimeout(this.userHeartbeats[userId].timeout);
        }

        // Set new timeout for 2 minutes of inactivity (just for monitoring)
        this.userHeartbeats[userId].timeout = setTimeout(() => {
            console.log(`User ${userId} appears to be inactive, but keeping in game`);
        }, 120000);
    }

    /**
     * Get time since last heartbeat for a user.
     */
    getTimeSinceLastSeen(userId) {
        const heartbeat = this.userHeartbeats[userId];
        return heartbeat ? Date.now() - heartbeat.lastSeen : Infinity;
    }

    /**
     * Check if user was recently active (within last 2 minutes).
     */
    wasRecentlyActive(userId) {
        return this.getTimeSinceLastSeen(userId) < 120000;
    }

    /**
     * Remove heartbeat tracking for a user.
     */
    removeHeartbeat(userId) {
        if (this.userHeartbeats[userId]?.timeout) {
            clearTimeout(this.userHeartbeats[userId].timeout);
        }
        delete this.userHeartbeats[userId];
    }

    /**
     * Mark a user as having explicitly left a game.
     */
    markExplicitlyLeft(userId) {
        this.explicitlyLeftUsers[userId] = true;
        // Clear the flag after 10 seconds
        setTimeout(() => {
            delete this.explicitlyLeftUsers[userId];
        }, 10000);
    }

    /**
     * Check if user explicitly left recently.
     */
    hasExplicitlyLeft(userId) {
        return !!this.explicitlyLeftUsers[userId];
    }

    /**
     * Clear the explicitly left flag for a user.
     */
    clearExplicitlyLeft(userId) {
        delete this.explicitlyLeftUsers[userId];
    }

    /**
     * Set a pending disconnect timer for a user.
     */
    setPendingDisconnect(userId, roomId, callback, timeout) {
        // Clear any existing pending disconnect
        this.clearPendingDisconnect(userId);

        this.pendingDisconnects[userId] = {
            roomId,
            timeout: setTimeout(() => {
                callback();
                delete this.pendingDisconnects[userId];
            }, timeout),
        };
    }

    /**
     * Get pending disconnect info for a user.
     */
    getPendingDisconnect(userId) {
        return this.pendingDisconnects[userId];
    }

    /**
     * Clear pending disconnect for a user.
     */
    clearPendingDisconnect(userId) {
        if (this.pendingDisconnects[userId]) {
            clearTimeout(this.pendingDisconnects[userId].timeout);
            delete this.pendingDisconnects[userId];
        }
    }

    /**
     * Check if user has a pending disconnect.
     */
    hasPendingDisconnect(userId) {
        return !!this.pendingDisconnects[userId];
    }
}

// Export singleton
module.exports = new SessionManager();
