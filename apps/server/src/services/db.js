const admin = require("firebase-admin");

class DBService {
    constructor() {
        this.db = null;
        this.collectionName = "games";
    }

    /**
     * Initializes the DB Service.
     * In production, fails fast if Firestore cannot be initialized.
     */
    initialize() {
        try {
            this.db = admin.firestore();
            this.db.settings({ ignoreUndefinedProperties: true });
            console.log(`✅ [DB Service] Initialized. Collection: '${this.collectionName}'`);
        } catch (e) {
            console.error("❌ [DB Service] Failed to initialize Firestore:", e.message);

            // In production, fail fast - don't run without persistence
            if (process.env.NODE_ENV === "production") {
                console.error("🛑 [DB Service] Critical: Cannot run without Firestore in production. Shutting down.");
                process.exit(1);
            }
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
     * Retrieves all active games for server restart recovery.
     */
    async getActiveGames() {
        if (!this.db) return [];

        try {
            // Only recover games updated in the last 3 hours (configurable via env)
            const recoveryWindowHours = parseInt(process.env.GAME_RECOVERY_HOURS || "3");
            const cutoffTime = new Date(Date.now() - recoveryWindowHours * 60 * 60 * 1000);

            const snapshot = await this.db
                .collection(this.collectionName)
                .where("phase", "in", ["lobby", "playing", "round_result"])
                .where("updatedAt", ">", cutoffTime)
                .orderBy("updatedAt", "desc")
                .limit(1000) // Safety limit to prevent loading too many games
                .get();

            if (snapshot.empty) {
                console.log("✅ [DB Service] No active games to recover.");
                return [];
            }

            const games = [];
            let skippedEmpty = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const playerCount = data.players ? data.players.length : 0;

                // Only recover games with at least 1 player
                if (playerCount > 0) {
                    games.push({ gameId: doc.id, ...data });
                } else {
                    skippedEmpty++;
                }
            });

            if (skippedEmpty > 0) {
                console.log(`⏭️  [DB Service] Skipped ${skippedEmpty} empty games (0 players).`);
            }

            console.log(
                `✅ [DB Service] Recovered ${games.length} active games (updated within last ${recoveryWindowHours}h).`
            );
            return games;
        } catch (error) {
            console.error(`❌ [DB Service] Failed to recover games: ${error.message}`);
            return [];
        }
    }
}

module.exports = new DBService();
