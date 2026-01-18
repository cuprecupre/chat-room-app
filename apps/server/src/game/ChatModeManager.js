/**
 * ChatModeManager - Manages clue submission and revelation for Chat Mode.
 * 
 * In Chat Mode, players write their clues instead of speaking.
 * Clues are submitted by players but revealed in turn order.
 */

const { cleanProfanity } = require("../utils/profanityFilter");

const CLUE_TIMEOUT_MS = 90000; // 90 seconds
const MAX_CLUE_LENGTH = 30;

class ChatModeManager {
    constructor(match, options = {}) {
        this.match = match;
        this.clues = new Map(); // playerId -> { text, submittedAt }
        this.currentTurnIndex = 0;
        this.revealedPlayerIds = [];
        this.turnStartedAt = null;
        this.turnTimer = null;
        // Callback for state changes (e.g., timeout) to emit to clients
        this.onStateChange = options.onStateChange || (() => { });
    }

    /**
     * Start the clue round. Called when match enters clue_round phase.
     */
    startClueRound() {
        this.clues.clear();
        this.currentTurnIndex = 0;
        this.revealedPlayerIds = [];
        this.startTurn();
    }

    /**
     * Get the current player whose turn it is.
     */
    getCurrentTurnPlayer() {
        const activePlayers = this.match.roundPlayers;
        if (this.currentTurnIndex >= activePlayers.length) {
            return null;
        }
        return activePlayers[this.currentTurnIndex];
    }

    /**
     * Start a new turn for the current player.
     */
    startTurn() {
        this.turnStartedAt = Date.now();
        this.clearTurnTimer();

        const currentPlayer = this.getCurrentTurnPlayer();
        if (!currentPlayer) {
            // All turns completed
            this.onAllCluesRevealed();
            return;
        }

        // If the current player already submitted their clue before their turn,
        // reveal it immediately and advance to the next turn
        if (this.clues.has(currentPlayer)) {
            this.revealCurrentClue();
            // Notify about state change so clients see the revealed clue
            this.onStateChange();
            return;
        }

        // Set timeout for this turn
        this.turnTimer = setTimeout(() => {
            this.handleTurnTimeout();
        }, CLUE_TIMEOUT_MS);
    }

    /**
     * Clear the current turn timer.
     */
    clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }

    /**
     * Submit a clue from a player.
     * The clue is stored but not revealed until it's the player's turn.
     * 
     * @param {string} playerId - The player submitting the clue
     * @param {string} clueText - The clue text
     * @returns {Object} - Result with success status and any error
     */
    submitClue(playerId, clueText) {
        // Validate player is in round
        if (!this.match.roundPlayers.includes(playerId)) {
            return { success: false, error: "Player not in round" };
        }

        // Check if already submitted
        if (this.clues.has(playerId)) {
            return { success: false, error: "Clue already submitted" };
        }

        // Validate clue length
        const trimmedClue = (clueText || "").trim();
        if (trimmedClue.length > MAX_CLUE_LENGTH) {
            return { success: false, error: `Clue too long (max ${MAX_CLUE_LENGTH} chars)` };
        }

        // Filter profanity
        const filteredClue = cleanProfanity(trimmedClue);

        // Store the clue
        this.clues.set(playerId, {
            text: filteredClue || "El jugador no ha dado pista",
            submittedAt: Date.now()
        });

        // If this is the current turn player, reveal and advance
        const currentTurnPlayer = this.getCurrentTurnPlayer();
        if (playerId === currentTurnPlayer) {
            this.revealCurrentClue();
        }

        return { success: true, clue: filteredClue };
    }

    /**
     * Reveal the current player's clue and advance to next turn.
     */
    revealCurrentClue() {
        const currentPlayer = this.getCurrentTurnPlayer();
        if (!currentPlayer) return;

        this.clearTurnTimer();

        // Get the clue (or default if not submitted)
        let clue = this.clues.get(currentPlayer);
        if (!clue) {
            // Player didn't submit - use empty clue
            clue = { text: "El jugador no ha dado pista", submittedAt: Date.now() };
            this.clues.set(currentPlayer, clue);
        }

        // Mark as revealed
        this.revealedPlayerIds.push(currentPlayer);

        // Advance to next turn
        this.currentTurnIndex++;
        this.startTurn();

        return {
            playerId: currentPlayer,
            clue: clue.text
        };
    }

    /**
     * Handle timeout for current turn.
     */
    handleTurnTimeout() {
        console.log(`[ChatMode] Turn timeout for player index ${this.currentTurnIndex}`);
        this.revealCurrentClue();

        // Notify about state change (for emitting to clients)
        this.onStateChange();

        // Check if all clues revealed and transition to voting
        if (this.areAllCluesRevealed()) {
            this.match.phase = "playing";
            console.log(`[ChatMode] All clues revealed via timeout - transitioning to voting`);
            this.onStateChange();
        }
    }

    /**
     * Called when all clues have been revealed.
     */
    onAllCluesRevealed() {
        this.clearTurnTimer();
        // The match should transition to voting phase
        // This will be handled by the socketHandlers
    }

    /**
     * Check if all clues have been revealed.
     */
    areAllCluesRevealed() {
        return this.revealedPlayerIds.length >= this.match.roundPlayers.length;
    }

    /**
     * Get the current state for the clue round.
     */
    getState() {
        const allClues = {};
        for (const [playerId, clue] of this.clues) {
            // Only include revealed clues or player's own clue
            if (this.revealedPlayerIds.includes(playerId)) {
                allClues[playerId] = clue.text;
            }
        }

        return {
            currentTurnPlayerId: this.getCurrentTurnPlayer(),
            currentTurnIndex: this.currentTurnIndex,
            revealedClues: allClues,
            submittedPlayerIds: Array.from(this.clues.keys()),
            revealedPlayerIds: this.revealedPlayerIds,
            turnStartedAt: this.turnStartedAt,
            timeoutMs: CLUE_TIMEOUT_MS,
        };
    }

    /**
     * Get clue for a specific player (only if revealed).
     */
    getClueForPlayer(playerId) {
        if (!this.revealedPlayerIds.includes(playerId)) {
            return null;
        }
        const clue = this.clues.get(playerId);
        return clue ? clue.text : null;
    }

    /**
     * Get all revealed clues as an object.
     */
    getAllRevealedClues() {
        const clues = {};
        for (const playerId of this.revealedPlayerIds) {
            const clue = this.clues.get(playerId);
            clues[playerId] = clue ? clue.text : "[sin pista]";
        }
        return clues;
    }

    /**
     * Check if a player has submitted their clue.
     */
    hasSubmitted(playerId) {
        return this.clues.has(playerId);
    }

    /**
     * Clean up resources.
     */
    destroy() {
        this.clearTurnTimer();
        this.clues.clear();
    }
}

module.exports = ChatModeManager;
