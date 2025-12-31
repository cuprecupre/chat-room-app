const express = require("express");
const gameManager = require("../services/gameManager");
const dbService = require("../services/db");
const statsManager = require("../services/statsManager");
const shutdownManager = require("../services/shutdownManager");

const router = express.Router();

// Admin secret for protected endpoints
const ADMIN_SECRET = process.env.ADMIN_SECRET;

/**
 * Middleware to verify admin authorization.
 */
function requireAdmin(req, res, next) {
    if (!ADMIN_SECRET) {
        return res.status(503).json({
            error: "Admin endpoints not configured. Set ADMIN_SECRET env variable.",
        });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.substring(7);
    if (token !== ADMIN_SECRET) {
        return res.status(403).json({ error: "Invalid admin secret" });
    }

    next();
}

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

// ============================================
// Admin Endpoints (protected by ADMIN_SECRET)
// ============================================

/**
 * POST /api/admin/shutdown
 * Start a graceful shutdown with countdown.
 *
 * Query params:
 *   - minutes: Countdown duration (1-60, default: 5)
 *
 * Usage:
 *   curl -X POST "http://localhost:3000/api/admin/shutdown?minutes=5" \
 *        -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 */
router.post("/admin/shutdown", requireAdmin, (req, res) => {
    const minutes = parseInt(req.query.minutes) || 5;

    const result = shutdownManager.startShutdown(minutes);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * DELETE /api/admin/shutdown
 * Cancel a pending shutdown.
 *
 * Usage:
 *   curl -X DELETE "http://localhost:3000/api/admin/shutdown" \
 *        -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 */
router.delete("/admin/shutdown", requireAdmin, (req, res) => {
    const result = shutdownManager.cancelShutdown();

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

/**
 * GET /api/admin/shutdown
 * Get current shutdown status.
 *
 * Usage:
 *   curl "http://localhost:3000/api/admin/shutdown" \
 *        -H "Authorization: Bearer YOUR_ADMIN_SECRET"
 */
router.get("/admin/shutdown", requireAdmin, (req, res) => {
    res.json(shutdownManager.getStatus());
});

module.exports = router;
