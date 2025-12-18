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
     * Upserts the game state to Firestore.
     */
    async saveGameState(gameId, state) {
        if (!this.db) return;

        try {
            const docRef = this.db.collection(this.collectionName).doc(gameId);
            const payload = {
                ...state,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await docRef.set(payload, { merge: true });
        } catch (error) {
            console.error(`⚠️ [DB Service] Save failed for ${gameId}: ${error.message}`);
        }
    }

    /**
     * Retrieves game state for recovery.
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
     * Retrieves all active games for server restart recovery.
     */
    async getActiveGames() {
        if (!this.db) return [];

        try {
            const snapshot = await this.db
                .collection(this.collectionName)
                .where("phase", "in", ["lobby", "playing", "round_result"])
                .get();

            if (snapshot.empty) return [];

            const games = [];
            snapshot.forEach((doc) => {
                games.push({ gameId: doc.id, ...doc.data() });
            });

            console.log(`✅ [DB Service] Recovered ${games.length} active games.`);
            return games;
        } catch (error) {
            console.error(`❌ [DB Service] Failed to recover games: ${error.message}`);
            return [];
        }
    }
}

module.exports = new DBService();
