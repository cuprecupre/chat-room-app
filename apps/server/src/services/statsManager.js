/**
 * StatsManager - Tracks server statistics in memory with periodic Firestore sync.
 * Singleton service for monitoring server activity.
 */
class StatsManager {
    constructor() {
        this.stats = {
            totalConnections: 0, // Total connections since server start
            roomsCreated: 0, // Total rooms created since server start
            matchesCompleted: 0, // Total matches completed since server start
            totalUsersCompletedMatches: 0, // Total users that went through game_over
            peakConcurrentUsers: 0, // Peak concurrent users
            peakConcurrentRooms: 0, // Peak concurrent rooms
            peakEmptyRooms: 0, // Peak empty rooms
            peakConcurrentMatches: 0, // Peak concurrent matches
            serverStartTime: Date.now(),
        };
        this.sessionManager = null;
        this.roomManager = null;
    }

    /**
     * Initialize the stats manager with dependencies.
     */
    initialize(sessionManager, roomManager) {
        this.sessionManager = sessionManager;
        this.roomManager = roomManager;
    }

    /**
     * Increment total connections counter.
     */
    incrementConnections() {
        this.stats.totalConnections++;
        this.updatePeakUsers();
    }

    /**
     * Increment rooms created counter.
     */
    incrementGamesCreated() {
        this.stats.roomsCreated++;
    }

    /**
     * Increment matches completed counter and persist to Firestore.
     */
    async incrementGamesCompleted(playerCount = 1) {
        this.stats.matchesCompleted++;
        this.stats.totalUsersCompletedMatches += playerCount;

        // Persist to Firestore (daily stats)
        const admin = require("firebase-admin");
        const ENABLE_DB_PERSISTENCE = process.env.ENABLE_DB_PERSISTENCE === "true";

        if (ENABLE_DB_PERSISTENCE) {
            try {
                const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
                const docRef = admin.firestore().collection("peak_stats").doc(today);

                await docRef.set(
                    {
                        date: today,
                        usersCompletedMatches: admin.firestore.FieldValue.increment(playerCount),
                        matchesCompleted: admin.firestore.FieldValue.increment(1),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
            } catch (error) {
                console.error("⚠️ [Stats] Failed to persist games completed:", error.message);
            }
        }
    }

    /**
     * Update peak concurrent users if current count exceeds peak.
     */
    updatePeakUsers() {
        if (!this.sessionManager) return;

        const currentUsers = Object.keys(this.sessionManager.userSockets).length;
        if (currentUsers > this.stats.peakConcurrentUsers) {
            this.stats.peakConcurrentUsers = currentUsers;
        }
    }

    /**
     * Get current server statistics.
     */
    getStats() {
        const connectedUsers = this.sessionManager
            ? Object.keys(this.sessionManager.userSockets).length
            : 0;
        const activeRooms = this.roomManager ? this.roomManager.getRoomCount() : 0;

        // Enhanced room metrics
        let usersInLobby = 0;
        let usersInMatch = 0;
        let activeMatches = 0;
        let emptyRooms = 0;

        if (this.roomManager) {
            const rooms = Object.values(this.roomManager.getAllRooms());
            rooms.forEach(room => {
                const playerCount = room.players.length;
                if (playerCount === 0) {
                    emptyRooms++;
                } else if (room.phase === 'playing' || room.phase === 'game_over' || room.phase === 'round_result') {
                    // Count playing, game_over, and round_result as "in match"
                    activeMatches++;
                    usersInMatch += playerCount;
                } else {
                    usersInLobby += playerCount;
                }
            });
        }

        // Update peak rooms
        if (activeRooms > this.stats.peakConcurrentRooms) {
            this.stats.peakConcurrentRooms = activeRooms;
        }

        // Update peak empty rooms
        if (emptyRooms > this.stats.peakEmptyRooms) {
            this.stats.peakEmptyRooms = emptyRooms;
        }

        // Update peak matches (includes playing + game_over)
        if (activeMatches > this.stats.peakConcurrentMatches) {
            this.stats.peakConcurrentMatches = activeMatches;
        }

        return {
            connectedUsers,
            activeRooms,
            usersInLobby,
            usersInMatch,
            activeMatches,
            emptyRooms,
            peakConcurrentUsers: this.stats.peakConcurrentUsers,
            peakConcurrentRooms: this.stats.peakConcurrentRooms,
            peakEmptyRooms: this.stats.peakEmptyRooms,
            peakConcurrentMatches: this.stats.peakConcurrentMatches,
            serverUptime: Math.floor((Date.now() - this.stats.serverStartTime) / 1000),
            timestamp: Date.now(),
        };
    }

    /**
     * Sync peak stats to Firestore (one document per day).
     */
    async syncPeaksToFirestore() {
        const admin = require("firebase-admin");
        const ENABLE_DB_PERSISTENCE = process.env.ENABLE_DB_PERSISTENCE === "true";

        if (!ENABLE_DB_PERSISTENCE) return;

        try {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
            const docRef = admin.firestore().collection("peak_stats").doc(today);

            await docRef.set(
                {
                    date: today,
                    peakConcurrentUsers: this.stats.peakConcurrentUsers,
                    peakConcurrentRooms: this.stats.peakConcurrentRooms,
                    peakEmptyRooms: this.stats.peakEmptyRooms,
                    peakConcurrentMatches: this.stats.peakConcurrentMatches,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            console.log(
                `📊 [Stats] Peaks synced for ${today}: users=${this.stats.peakConcurrentUsers}, rooms=${this.stats.peakConcurrentRooms}, empty=${this.stats.peakEmptyRooms}, matches=${this.stats.peakConcurrentMatches}`
            );
        } catch (error) {
            console.error("⚠️ [Stats] Failed to sync peaks:", error.message);
        }
    }
}

// Export singleton
module.exports = new StatsManager();
