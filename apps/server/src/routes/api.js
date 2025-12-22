const express = require("express");
const gameManager = require("../services/gameManager");
const dbService = require("../services/db");
const statsManager = require("../services/statsManager");

const router = express.Router();

/**
 * GET /api/game/:gameId
 * Get game preview info (for join links, social sharing, etc.)
 */
router.get("/game/:gameId", async (req, res) => {
    const { gameId } = req.params;
    const safeGameId = (gameId || "").toUpperCase();

    let game = gameManager.getGame(safeGameId);
    let hostName = "Anfitrión desconocido";
    let playerCount = 0;
    let status = "unknown";
    let found = false;

    if (game) {
        // Memory hit
        const host = game.players.find((p) => p.uid === game.hostId);
        hostName = host ? host.name : "Anfitrión desconocido";
        playerCount = game.players.length;
        status = game.phase;
        found = true;
    } else {
        // Memory miss -> Try lazy DB lookup
        try {
            const state = await dbService.getGameState(safeGameId);
            if (state) {
                const host = state.players
                    ? state.players.find((p) => p.uid === state.hostId)
                    : null;
                hostName = host ? host.name : "Partida recuperada";
                playerCount = state.players ? state.players.length : 0;
                status = state.phase;
                found = true;
            }
        } catch (e) {
            console.error(`Error lazy loading game ${safeGameId}:`, e);
        }
    }

    if (!found) {
        return res.status(404).json({ error: "Game not found" });
    }

    res.json({
        gameId: safeGameId,
        hostName: hostName,
        playerCount: playerCount,
        status: status,
    });
});

/**
 * GET /api/stats
 * Get real-time server statistics
 */
router.get("/stats", (req, res) => {
    res.json(statsManager.getStats());
});

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 */
router.get("/health", async (req, res) => {
    const startTime = Date.now();

    // Check Firestore connectivity
    const firestoreHealth = await dbService.isHealthy();

    // Get basic stats
    const stats = statsManager.getStats();

    const health = {
        status: firestoreHealth.healthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            firestore: {
                status: firestoreHealth.healthy ? "ok" : "error",
                latencyMs: firestoreHealth.latencyMs,
                error: firestoreHealth.error,
            },
            server: {
                status: "ok",
                connectedUsers: stats.connectedUsers,
                activeGames: stats.activeGames,
            },
        },
        responseTimeMs: Date.now() - startTime,
    };

    const statusCode = firestoreHealth.healthy ? 200 : 503;
    res.status(statusCode).json(health);
});

module.exports = router;
