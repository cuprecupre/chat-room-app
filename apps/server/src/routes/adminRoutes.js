const express = require("express");
const { verifyFirebaseToken } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");
const roomManager = require("../services/roomManager");
const statsManager = require("../services/statsManager");

const router = express.Router();

// All admin routes require authentication + admin verification
router.use(verifyFirebaseToken);
router.use(isAdmin);

/**
 * GET /api/admin/verify
 * Verify if the current user is an admin.
 * If this endpoint returns 200, the user is an admin.
 */
router.get("/verify", (req, res) => {
    res.json({
        isAdmin: true,
        uid: req.user.uid,
        name: req.user.name,
    });
});

/**
 * GET /api/admin/dashboard
 * Get dashboard overview data.
 */
router.get("/dashboard", (req, res) => {
    const stats = statsManager.getStats();
    const rooms = roomManager.getAllRooms();

    res.json({
        stats,
        activeRooms: rooms.map((room) => ({
            roomId: room.roomId,
            hostId: room.hostId,
            playerCount: room.players.length,
            phase: room.phase,
            createdAt: room.createdAt,
        })),
    });
});

/**
 * GET /api/admin/feedback
 * Placeholder for feedback management.
 */
router.get("/feedback", (req, res) => {
    res.json({ message: "Feedback endpoint - not implemented yet" });
});

/**
 * GET /api/admin/users
 * Placeholder for user management.
 */
router.get("/users", (req, res) => {
    res.json({ message: "Users endpoint - not implemented yet" });
});

module.exports = router;
