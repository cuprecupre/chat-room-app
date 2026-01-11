const express = require("express");
const roomManager = require("../services/roomManager");
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
 * GET /api/game/:roomId
 * Get room/game preview info (for join links, social sharing, etc.)
 * Note: Now checks in-memory Rooms (Phase 1 architecture)
 */
router.get("/game/:roomId", (req, res) => {
    const { roomId } = req.params;
    const safeRoomId = (roomId || "").toUpperCase();

    const room = roomManager.getRoom(safeRoomId);

    if (!room) {
        return res.status(404).json({ error: "Room not found" });
    }

    const host = room.players.find((p) => p.uid === room.hostId);

    res.json({
        roomId: safeRoomId,
        gameId: safeRoomId, // Maintain gameId for client compatibility
        hostName: host ? host.name : "Anfitrión desconocido",
        playerCount: room.players.length,
        status: room.phase,
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

/**
 * GET /api/player/:uid/stats
 * Get player statistics from Firestore.
 */
router.get("/player/:uid/stats", async (req, res) => {
    const { uid } = req.params;

    if (!uid) {
        return res.status(400).json({ error: "UID is required" });
    }

    try {
        const stats = await dbService.getPlayerStats(uid);

        if (!stats) {
            // Return defaults if no stats found
            return res.json({
                points: 0,
                gamesPlayed: 0,
                gamesCompleted: 0,
                gamesAbandoned: 0,
                gamesAsImpostor: 0,
                winsAsImpostor: 0,
                winsAsFriend: 0,
                playTimeSeconds: 0,
            });
        }

        res.json({
            points: stats.points || 0,
            gamesPlayed: stats.gamesPlayed || 0,
            gamesCompleted: stats.gamesCompleted || 0,
            gamesAbandoned: stats.gamesAbandoned || 0,
            gamesAsImpostor: stats.gamesAsImpostor || 0,
            winsAsImpostor: stats.winsAsImpostor || 0,
            winsAsFriend: stats.winsAsFriend || 0,
            playTimeSeconds: stats.playTimeSeconds || 0,
            displayName: stats.displayName,
            photoURL: stats.photoURL,
        });
    } catch (error) {
        console.error("[API] Error fetching player stats:", error);
        res.status(500).json({ error: "Failed to fetch player stats" });
    }
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
