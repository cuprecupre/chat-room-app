const express = require("express");
const gameManager = require("../services/gameManager");
const dbService = require("../services/db");
const statsManager = require("../services/statsManager");

const router = express.Router();

/**
 * GET /api/game/:gameId
 * Get game preview info (for join links, social sharing, etc.)
 * Note: Only checks in-memory games (no Firestore fallback since games are not persisted during play)
 */
router.get("/game/:gameId", (req, res) => {
    const { gameId } = req.params;
    const safeGameId = (gameId || "").toUpperCase();

    const game = gameManager.getGame(safeGameId);

    if (!game) {
        return res.status(404).json({ error: "Game not found" });
    }

    const host = game.players.find((p) => p.uid === game.hostId);

    res.json({
        gameId: safeGameId,
        hostName: host ? host.name : "Anfitrión desconocido",
        playerCount: game.players.length,
        status: game.phase,
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
