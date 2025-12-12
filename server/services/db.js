const admin = require('firebase-admin');

class DBService {
    constructor() {
        this.db = null;
        this.collectionName = null;
        this.enabled = false;
    }

    /**
     * Initializes the DB Service with configuration options.
     * @param {Object} options
     * @param {boolean} options.enabled - Whether persistence is enabled via feature flag.
     * @param {string} options.collectionName - Name of the Firestore collection (e.g., 'games', 'dev_games').
     */
    initialize(options = {}) {
        this.enabled = options.enabled === true;

        if (!this.enabled) {
            console.log('🚧 [DB Service] Persistence is DISABLED (Feature Flag off).');
            return;
        }

        try {
            // Assumes firebase-admin has been initialized in server.js
            this.db = admin.firestore();
            this.collectionName = options.collectionName || 'dev_games';
            console.log(`✅ [DB Service] Persistence ENABLED. Targets collection: '${this.collectionName}'`);
        } catch (e) {
            console.error('❌ [DB Service] Failed to initialize Firestore instance. Disabling persistence.', e.message);
            this.enabled = false;
        }
    }

    /**
     * Upserts the game state to Firestore.
     * Uses set({merge: true}) to allow partial updates if needed, though usually we send full state.
     * Silently catches errors to prevent game loop interruption (DEFENSIVE CODING).
     */
    async saveGameState(gameId, state) {
        if (!this.enabled || !this.db) return;

        try {
            const docRef = this.db.collection(this.collectionName).doc(gameId);

            // Add metadata
            const payload = {
                ...state,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // If it's a new document, add createdAt
            // We can't easily feel if it's new without a read, but we can set it if missing?
            // For simplicity, we just merge. If we want createdAt, we should ideally include it in the state object passed from Game.js
            // or use a pre-condition. For now, updatedAt is sufficient for most debug needs.

            await docRef.set(payload, { merge: true });
        } catch (error) {
            // Log but don't crash
            console.error(`⚠️ [DB Service] Save failed for ${gameId}: ${error.message}`);
        }
    }

    /**
     * Retrieves game state for recovery.
     * Returns null if not found or error.
     */
    async getGameState(gameId) {
        if (!this.enabled || !this.db) return null;

        try {
            const doc = await this.db.collection(this.collectionName).doc(gameId).get();
            if (!doc.exists) {
                return null;
            }
            return doc.data();
        } catch (error) {
            console.error(`⚠️ [DB Service] Load failed for ${gameId}: ${error.message}`);
            return null;
        }
    }
    /**
     * Retrieves all games that are not 'game_over'.
     * Used for server restart recovery.
     */
    async getActiveGames() {
        if (!this.enabled || !this.db) return [];

        try {
            // NOTE: '!=' queries in Firestore have limitations and might require indexes.
            // An alternative is to just get all and filter, or store a dedicated 'active' boolean.
            // For now, let's try the simple query. If it fails due to index, we'll log it.
            // A safer approach regarding indexes is query phase 'in' ['lobby', 'playing', 'round_result']
            const snapshot = await this.db.collection(this.collectionName)
                .where('phase', 'in', ['lobby', 'playing', 'round_result'])
                .get();

            if (snapshot.empty) {
                return [];
            }

            const games = [];
            snapshot.forEach(doc => {
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

// Export singleton
module.exports = new DBService();
