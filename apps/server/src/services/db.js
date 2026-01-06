const admin = require("firebase-admin");

class DBService {
    constructor() {
        this.db = null;
        this.roomsCollection = "rooms";
        this.matchesCollection = "matches";
        this.playerStatsCollection = "player_stats";
    }

    /**
     * Initializes the DB Service.
     */
    initialize() {
        try {
            this.db = admin.firestore();
            this.db.settings({ ignoreUndefinedProperties: true });
            console.log(`✅ [DB Service] Initialized.`);
        } catch (e) {
            console.error("❌ [DB Service] Failed to initialize Firestore:", e.message);
        }
    }

    /**
     * Checks if Firestore is healthy and responsive.
     * @returns {Promise<{healthy: boolean, latencyMs: number|null, error: string|null}>}
     */
    async isHealthy() {
        if (!this.db) {
            return { healthy: false, latencyMs: null, error: "Firestore not initialized" };
        }

        const start = Date.now();
        try {
            // Perform a lightweight read to verify connectivity
            await this.db.collection("_health").limit(1).get();
            const latencyMs = Date.now() - start;
            return { healthy: true, latencyMs, error: null };
        } catch (e) {
            return { healthy: false, latencyMs: null, error: e.message };
        }
    }

    /**
     * Saves room metadata to Firestore.
     */
    async saveRoom(roomId, roomData) {
        if (!this.db) return;
        try {
            const docRef = this.db.collection(this.roomsCollection).doc(roomId);
            await docRef.set({
                ...roomData,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`✅ [DB Service] Room ${roomId} persisted`);
        } catch (error) {
            console.error(`⚠️ [DB Service] Room save failed for ${roomId}: ${error.message}`);
        }
    }

    /**
     * Saves match results to Firestore.
     */
    async saveMatch(matchId, matchData) {
        if (!this.db) return;
        try {
            const docRef = this.db.collection(this.matchesCollection).doc(matchId);
            await docRef.set({
                ...matchData,
                savedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ [DB Service] Match ${matchId} persisted`);
        } catch (error) {
            console.error(`⚠️ [DB Service] Match save failed for ${matchId}: ${error.message}`);
        }
    }



    /**
     * Updates player statistics incrementally.
     * @param {string} uid - User ID
     * @param {Object} stats - Stats to increment/update
     */
    async updatePlayerStats(uid, stats = {}) {
        if (!this.db || !uid) return;

        try {
            const docRef = this.db.collection(this.playerStatsCollection).doc(uid);

            const updates = {
                lastPlayedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Metadata updates (name, photo)
            if (stats.displayName) updates.displayName = stats.displayName;
            if (stats.photoURL) updates.photoURL = stats.photoURL;

            // Numeric increments
            const numericFields = [
                'gamesPlayed',
                'gamesAbandoned',
                'gamesCompleted',
                'gamesAsImpostor',
                'winsAsImpostor',
                'winsAsFriend',
                'points',
                'playTimeSeconds'
            ];

            numericFields.forEach(field => {
                if (stats[field]) {
                    updates[field] = admin.firestore.FieldValue.increment(stats[field]);
                }
            });

            await docRef.set(updates, { merge: true });
            console.log(`✅ [DB Service] Stats updated for user ${uid}`);
        } catch (error) {
            console.error(`⚠️ [DB Service] Stats update failed for ${uid}: ${error.message}`);
        }
    }

    /**
     * Retrieves player statistics.
     * @param {string} uid - User ID
     */
    async getPlayerStats(uid) {
        if (!this.db || !uid) return null;

        try {
            const doc = await this.db.collection(this.playerStatsCollection).doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error(`⚠️ [DB Service] Profile load failed for ${uid}: ${error.message}`);
            return null;
        }
    }
}

module.exports = new DBService();
