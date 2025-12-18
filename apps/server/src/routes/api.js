const express = require("express");
const gameManager = require("../services/gameManager");
const dbService = require("../services/db");

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

module.exports = router;
