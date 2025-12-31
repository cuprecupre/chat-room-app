const gameManager = require("./gameManager");

/**
 * ShutdownManager - Handles graceful server shutdown.
 *
 * Supports manual shutdown via admin endpoint with:
 * - Configurable countdown timer
 * - Real-time countdown updates to clients
 * - Blocking new game creation during shutdown
 * - Analytics persistence for active games
 */
class ShutdownManager {
    constructor() {
        this.io = null;
        this.server = null;
        this.isShuttingDown = false;
        this.shutdownEndTime = null;
        this.countdownInterval = null;
    }

    /**
     * Initialize with Socket.IO and HTTP server instances.
     */
    initialize(io, server) {
        this.io = io;
        this.server = server;
        this.registerSignalHandlers();
        console.log("✅ [Shutdown Manager] Initialized");
    }

    /**
     * Register handlers for termination signals (fallback for unexpected shutdowns).
     */
    registerSignalHandlers() {
        process.on("SIGTERM", () => this.handleSignal("SIGTERM"));
        process.on("SIGINT", () => this.handleSignal("SIGINT"));
    }

    /**
     * Handle OS signals - immediate shutdown without countdown.
     */
    async handleSignal(signal) {
        if (this.isShuttingDown) {
            console.log(`[Shutdown] Already shutting down, ignoring ${signal}`);
            return;
        }

        console.log(`\n[Shutdown] ${signal} received. Performing immediate shutdown...`);
        this.isShuttingDown = true;

        // Save analytics and exit immediately
        await this.finalizeActiveGames();
        this.closeConnections();
        await this.closeServer();
        process.exit(0);
    }

    /**
     * Start a manual shutdown with countdown.
     * Called from admin endpoint.
     * @param {number} minutes - Countdown duration in minutes
     * @returns {object} - Status object
     */
    startShutdown(minutes) {
        if (this.isShuttingDown) {
            return {
                success: false,
                error: "Shutdown already in progress",
                remainingSeconds: this.getRemainingSeconds(),
            };
        }

        if (minutes < 1 || minutes > 60) {
            return {
                success: false,
                error: "Minutes must be between 1 and 60",
            };
        }

        this.isShuttingDown = true;
        this.shutdownEndTime = Date.now() + minutes * 60 * 1000;

        console.log(`\n[Shutdown] Manual shutdown initiated. Countdown: ${minutes} minutes`);

        // Notify clients immediately
        this.broadcastCountdown();

        // Start countdown interval (update every second)
        this.countdownInterval = setInterval(() => {
            const remaining = this.getRemainingSeconds();

            if (remaining <= 0) {
                this.executeShutdown();
            } else {
                this.broadcastCountdown();
            }
        }, 1000);

        return {
            success: true,
            message: `Shutdown scheduled in ${minutes} minutes`,
            shutdownAt: new Date(this.shutdownEndTime).toISOString(),
        };
    }

    /**
     * Cancel a pending shutdown.
     * @returns {object} - Status object
     */
    cancelShutdown() {
        if (!this.isShuttingDown) {
            return {
                success: false,
                error: "No shutdown in progress",
            };
        }

        console.log("[Shutdown] Shutdown cancelled by admin");

        this.isShuttingDown = false;
        this.shutdownEndTime = null;

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        // Notify clients that shutdown was cancelled
        if (this.io) {
            this.io.emit("shutdown-cancelled", {
                message: "El mantenimiento ha sido cancelado",
            });
        }

        return {
            success: true,
            message: "Shutdown cancelled",
        };
    }

    /**
     * Get remaining seconds until shutdown.
     */
    getRemainingSeconds() {
        if (!this.shutdownEndTime) return 0;
        return Math.max(0, Math.ceil((this.shutdownEndTime - Date.now()) / 1000));
    }

    /**
     * Get current shutdown status.
     */
    getStatus() {
        return {
            isShuttingDown: this.isShuttingDown,
            remainingSeconds: this.getRemainingSeconds(),
            shutdownAt: this.shutdownEndTime
                ? new Date(this.shutdownEndTime).toISOString()
                : null,
        };
    }

    /**
     * Broadcast countdown to all connected clients.
     */
    broadcastCountdown() {
        if (!this.io) return;

        const remainingSeconds = this.getRemainingSeconds();

        this.io.emit("shutdown-countdown", {
            remainingSeconds,
            message: this.getCountdownMessage(remainingSeconds),
        });
    }

    /**
     * Get human-readable countdown message.
     */
    getCountdownMessage(seconds) {
        if (seconds <= 0) return "Server shutting down now...";

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        if (minutes > 0) {
            return `Mantenimiento en ${minutes}:${secs.toString().padStart(2, "0")}`;
        }
        return `Mantenimiento en ${secs} segundos`;
    }

    /**
     * Execute the actual shutdown after countdown completes.
     */
    async executeShutdown() {
        console.log("[Shutdown] Countdown complete. Executing shutdown...");

        // Stop the countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        try {
            // Notify clients to return to lobby
            if (this.io) {
                this.io.emit("shutdown-complete", {
                    message: "El servidor se está reiniciando. Por favor espera...",
                });
            }

            // Small delay to ensure message is sent
            await new Promise((r) => setTimeout(r, 500));

            // Save analytics for active games
            await this.finalizeActiveGames();

            // Close connections
            this.closeConnections();

            // Close server and exit
            await this.closeServer();

            console.log("[Shutdown] Graceful shutdown complete.");
            process.exit(0);
        } catch (error) {
            console.error("[Shutdown] Error during shutdown:", error);
            process.exit(1);
        }
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
