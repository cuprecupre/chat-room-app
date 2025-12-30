const gameManager = require("./gameManager");

/**
 * ShutdownManager - Handles graceful server shutdown.
 * Notifies clients, waits for games to end, and saves analytics.
 */
class ShutdownManager {
    constructor() {
        this.io = null;
        this.server = null;
        this.isShuttingDown = false;
        this.gracePeriod = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize with Socket.IO and HTTP server instances.
     */
    initialize(io, server) {
        this.io = io;
        this.server = server;
        this.registerSignalHandlers();
        console.log("✅ [Shutdown Manager] Initialized with 5 minute grace period");
    }

    /**
     * Register handlers for termination signals.
     */
    registerSignalHandlers() {
        process.on("SIGTERM", () => this.initiateShutdown("SIGTERM"));
        process.on("SIGINT", () => this.initiateShutdown("SIGINT"));
    }

    /**
     * Initiate graceful shutdown sequence.
     */
    async initiateShutdown(signal) {
        if (this.isShuttingDown) {
            console.log(`[Shutdown] Already shutting down, ignoring ${signal}`);
            return;
        }

        this.isShuttingDown = true;
        console.log(`\n[Shutdown] ${signal} received. Starting graceful shutdown...`);

        try {
            // Step 1: Notify all connected clients
            this.notifyClients();

            // Step 2: Wait for grace period to allow games to end naturally
            console.log(
                `[Shutdown] Waiting ${this.gracePeriod / 1000}s for games to end...`
            );
            await this.waitForGracePeriod();

            // Step 3: Force-end remaining games and save analytics
            await this.finalizeActiveGames();

            // Step 4: Close socket connections
            this.closeConnections();

            // Step 5: Close HTTP server
            await this.closeServer();

            console.log("[Shutdown] Graceful shutdown complete.");
            process.exit(0);
        } catch (error) {
            console.error("[Shutdown] Error during shutdown:", error);
            process.exit(1);
        }
    }

    /**
     * Notify all connected clients that server is shutting down.
     */
    notifyClients() {
        if (!this.io) return;

        console.log("[Shutdown] Notifying all connected clients...");
        this.io.emit("server-shutdown", {
            message: "Server shutting down for maintenance",
            gracePeriodMs: this.gracePeriod,
        });
    }

    /**
     * Wait for the grace period.
     */
    waitForGracePeriod() {
        return new Promise((resolve) => {
            setTimeout(resolve, this.gracePeriod);
        });
    }

    /**
     * Save analytics for all active games that are not in lobby.
     */
    async finalizeActiveGames() {
        const games = gameManager.getAllGames();
        const gameIds = Object.keys(games);

        if (gameIds.length === 0) {
            console.log("[Shutdown] No active games to finalize.");
            return;
        }

        console.log(`[Shutdown] Finalizing ${gameIds.length} active games...`);

        for (const gameId of gameIds) {
            const game = games[gameId];
            try {
                // Save analytics for any game that was in progress
                if (game.phase !== "lobby") {
                    game.persistAnalytics("server_shutdown");
                    console.log(`[Shutdown] Saved analytics for game ${gameId}`);
                }
            } catch (error) {
                console.error(
                    `[Shutdown] Failed to save game ${gameId}:`,
                    error.message
                );
            }
        }
    }

    /**
     * Close all socket connections.
     */
    closeConnections() {
        if (!this.io) return;

        console.log("[Shutdown] Closing all socket connections...");
        this.io.disconnectSockets(true);
    }

    /**
     * Close the HTTP server.
     */
    closeServer() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }

            console.log("[Shutdown] Closing HTTP server...");
            this.server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = new ShutdownManager();
