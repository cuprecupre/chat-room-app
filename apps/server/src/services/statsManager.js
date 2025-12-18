/**
 * StatsManager - Tracks server statistics in memory with periodic Firestore sync.
 * Singleton service for monitoring server activity.
 */
class StatsManager {
    constructor() {
        this.stats = {
            totalConnections: 0, // Total connections since server start
            gamesCreated: 0, // Total games created since server start
            gamesCompleted: 0, // Total games completed since server start
            peakConcurrentUsers: 0, // Peak concurrent users
            serverStartTime: Date.now(),
        };
        this.sessionManager = null;
        this.gameManager = null;
    }

    /**
     * Initialize the stats manager with dependencies.
     */
    initialize(sessionManager, gameManager) {
        this.sessionManager = sessionManager;
        this.gameManager = gameManager;
    }

    /**
     * Increment total connections counter.
     */
    incrementConnections() {
        this.stats.totalConnections++;
        this.updatePeakUsers();
    }

    /**
     * Increment games created counter.
     */
    incrementGamesCreated() {
        this.stats.gamesCreated++;
    }

    /**
     * Increment games completed counter.
     */
    incrementGamesCompleted() {
        this.stats.gamesCompleted++;
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
        const activeGames = this.gameManager ? this.gameManager.getGameCount() : 0;

        return {
            connectedUsers,
            activeGames,
            totalConnections: this.stats.totalConnections,
            gamesCreated: this.stats.gamesCreated,
            peakConcurrentUsers: this.stats.peakConcurrentUsers,
            serverUptime: Math.floor((Date.now() - this.stats.serverStartTime) / 1000),
            timestamp: Date.now(),
        };
    }

    /**
     * Sync current stats to Firestore.
     */
    async syncToFirestore() {
        const admin = require("firebase-admin");
        const ENABLE_DB_PERSISTENCE = process.env.ENABLE_DB_PERSISTENCE === "true";

        if (!ENABLE_DB_PERSISTENCE) return;

        try {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
            const docRef = admin.firestore().collection("stats").doc(today);

            const currentStats = this.getStats();

            await docRef.set(
                {
                    date: today,
                    totalConnections: this.stats.totalConnections,
                    gamesCreated: this.stats.gamesCreated,
                    gamesCompleted: this.stats.gamesCompleted,
                    peakConcurrentUsers: this.stats.peakConcurrentUsers,
                    currentConnectedUsers: currentStats.connectedUsers,
                    currentActiveGames: currentStats.activeGames,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            console.log(
                `📊 [Stats] Synced to Firestore: ${currentStats.connectedUsers} users, ${currentStats.activeGames} games`
            );
        } catch (error) {
            console.error("⚠️ [Stats] Failed to sync:", error.message);
        }
    }
}

// Export singleton
module.exports = new StatsManager();
