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
        // Track pending game deletions { [gameId]: timeoutId }
        this.pendingDeletions = {};
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
     * Emit minimal vote update to all players in a game.
     * Only sends votedPlayers list instead of full state (~100x less data).
     * @param {Game} game - The game instance
     * @param {string} voterId - The user who just voted
     * @param {string} targetId - Who they voted for (null if unmarking)
     */
    emitVoteUpdate(game, voterId, targetId) {
        if (!this.io) return;

        const votedPlayers = Object.keys(game.votes);
        const activePlayers = game.roundPlayers.filter(
            (uid) => !game.eliminatedInRound.includes(uid)
        );

        // Send to all players in the game room
        game.players.forEach((p) => {
            const playerSocketId = sessionManager.getUserSocket(p.uid);
            if (playerSocketId) {
                // Each player gets their own vote status
                this.io.to(playerSocketId).emit("vote-update", {
                    votedPlayers,
                    myVote: game.votes[p.uid] || null,
                    hasVoted: game.votes.hasOwnProperty(p.uid),
                    activePlayers,
                });
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

    /**
     * Schedule delayed deletion of an empty game.
     * If players rejoin within the grace period, the deletion is cancelled.
     * @param {string} gameId - The game to schedule for deletion
     * @param {number} delayMs - Delay in milliseconds (default: 5 minutes)
     */
    scheduleEmptyGameCleanup(gameId, delayMs = 5 * 60 * 1000) {
        // Cancel any existing deletion timer for this game
        if (this.pendingDeletions[gameId]) {
            clearTimeout(this.pendingDeletions[gameId]);
            delete this.pendingDeletions[gameId];
        }

        const game = this.games[gameId];
        if (!game) return;

        // Only schedule cleanup if game is truly empty
        if (game.players.length > 0) {
            console.log(
                `[Cleanup] Game ${gameId} has ${game.players.length} players, skipping cleanup`
            );
            return;
        }

        console.log(
            `⏳ [Cleanup] Empty game ${gameId} scheduled for deletion in ${delayMs / 1000 / 60} minutes`
        );

        const timeoutId = setTimeout(() => {
            const currentGame = this.games[gameId];

            // Double-check game still exists and is still empty
            if (!currentGame) {
                console.log(`[Cleanup] Game ${gameId} already removed`);
                delete this.pendingDeletions[gameId];
                return;
            }

            if (currentGame.players.length > 0) {
                console.log(
                    `[Cleanup] Game ${gameId} has ${currentGame.players.length} players, cancelling deletion`
                );
                delete this.pendingDeletions[gameId];
                return;
            }

            // Delete from memory only (keep in Firestore for recovery)
            delete this.games[gameId];
            delete this.pendingDeletions[gameId];

            console.log(
                `🗑️  [Cleanup] Removed empty game ${gameId} from memory (kept in Firestore)`
            );
        }, delayMs);

        this.pendingDeletions[gameId] = timeoutId;
    }

    /**
     * Cancel scheduled deletion for a game (called when player rejoins).
     * @param {string} gameId - The game to cancel deletion for
     */
    cancelEmptyGameCleanup(gameId) {
        if (this.pendingDeletions[gameId]) {
            clearTimeout(this.pendingDeletions[gameId]);
            delete this.pendingDeletions[gameId];
            console.log(`✅ [Cleanup] Cancelled deletion for game ${gameId} (player rejoined)`);
        }
    }
}

// Export singleton
module.exports = new GameManager();
