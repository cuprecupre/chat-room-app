const admin = require("firebase-admin");

class DBService {
    constructor() {
        this.db = null;
        this.collectionName = "games";
    }

    /**
     * Initializes the DB Service.
     */
    initialize() {
        try {
            this.db = admin.firestore();
            this.db.settings({ ignoreUndefinedProperties: true });
            console.log(`✅ [DB Service] Initialized. Collection: '${this.collectionName}'`);
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
     * Retrieves game state (for admin purposes).
     */
    async getGameState(gameId) {
        if (!this.db) return null;

        try {
            const doc = await this.db.collection(this.collectionName).doc(gameId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error(`⚠️ [DB Service] Load failed for ${gameId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Deletes a game from Firestore.
     */
    async deleteGameState(gameId) {
        if (!this.db) return;

        try {
            await this.db.collection(this.collectionName).doc(gameId).delete();
        } catch (error) {
            console.error(`⚠️ [DB Service] Delete failed for ${gameId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Saves game analytics to the game_analytics collection.
     * Called only when a game ends (for analytics purposes).
     */
    async saveGameAnalytics(gameId, analyticsData) {
        if (!this.db) return;

        try {
            const docRef = this.db.collection("game_analytics").doc(gameId);
            await docRef.set({
                ...analyticsData,
                savedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ [DB Service] Analytics saved for game ${gameId}`);
        } catch (error) {
            console.error(`⚠️ [DB Service] Analytics save failed for ${gameId}: ${error.message}`);
        }
    }
}

module.exports = new DBService();
