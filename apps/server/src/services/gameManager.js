const Game = require("../Game");
const dbService = require("./db");
const sessionManager = require("./sessionManager");

/**
 * GameManager - Manages game instances and state broadcasting.
 * Singleton service for all game-related operations.
 */
class GameManager {
    constructor() {
        // { [gameId]: Game instance }
        this.games = {};
        // Socket.IO instance (set during initialization)
        this.io = null;
    }

    /**
     * Initialize with Socket.IO instance.
     */
    initialize(io) {
        this.io = io;
    }

    /**
     * Create a new game.
     */
    createGame(user, options = {}) {
        const game = new Game(user, options);
        this.games[game.gameId] = game;
        return game;
    }

    /**
     * Get a game by ID.
     */
    getGame(gameId) {
        return this.games[gameId];
    }

    /**
     * Find which game a user belongs to.
     */
    findUserGame(userId) {
        return Object.values(this.games).find((g) => g.players.some((p) => p.uid === userId));
    }

    /**
     * Check if user is in a specific game.
     */
    isUserInGame(userId, gameId) {
        const game = this.games[gameId];
        return game && game.players.some((p) => p.uid === userId);
    }

    /**
     * Broadcast game state to all players in a game.
     * Each player receives their personalized view of the state.
     */
    emitGameState(game) {
        if (!this.io) {
            console.error("[GameManager] Socket.IO not initialized");
            return;
        }

        game.players.forEach((p) => {
            const playerSocketId = sessionManager.getUserSocket(p.uid);
            if (playerSocketId) {
                this.io.to(playerSocketId).emit("game-state", game.getStateFor(p.uid));
            }
        });
    }

    /**
     * Send a toast message to all players in a game room.
     */
    emitToast(gameId, message) {
        if (!this.io) return;
        this.io.to(gameId).emit("toast", message);
    }

    /**
     * Recover active games from database on server startup.
     */
    async recoverGames() {
        console.log("🔄 [GameManager] Starting game recovery process...");
        try {
            const activeGames = await dbService.getActiveGames();
            activeGames.forEach((data) => {
                try {
                    const game = Game.fromState(data.gameId, data);
                    this.games[data.gameId] = game;
                } catch (e) {
                    console.error(
                        `❌ [GameManager] Failed to restore game ${data.gameId}:`,
                        e.message
                    );
                }
            });
            console.log(
                `✅ [GameManager] Recovery complete. ${Object.keys(this.games).length} games loaded into memory.`
            );
        } catch (e) {
            console.error("❌ [GameManager] Recovery procedure failed:", e);
        }
    }

    /**
     * Get all games (for debugging/admin purposes).
     */
    getAllGames() {
        return this.games;
    }

    /**
     * Get count of active games.
     */
    getGameCount() {
        return Object.keys(this.games).length;
    }
}

// Export singleton
module.exports = new GameManager();
