const dbService = require("./services/db");
const statsManager = require("./services/statsManager");
const PlayerManager = require("./game/PlayerManager");
const VotingManager = require("./game/VotingManager");
const RoundManager = require("./game/RoundManager");
const GameStateSerializer = require("./game/GameStateSerializer");

/**
 * Match - A single game session (1-3 rounds) within a Room.
 * 
 * Matches are ephemeral and created fresh for each "Play Again".
 * Room-level state (playerOrder, host, history) is passed in from Room.
 */
class Match {
    /**
     * Create a new Match instance.
     * @param {Room|Object} roomOrHostUser - Room instance or legacy hostUser object
     * @param {Object} options - Match options
     */
    constructor(roomOrHostUser, options = {}) {
        // Detect if this is a Room instance or a legacy hostUser object
        // Room has roomId property, hostUser has uid property
        const isRoom = roomOrHostUser && roomOrHostUser.roomId !== undefined;

        if (isRoom) {
            // New Room-based architecture
            const room = roomOrHostUser;

            // Room context
            this.roomId = room.roomId;
            this.matchId = this.generateMatchId();
            this.hostId = room.hostId;

            // Copy players from room (eligible players only)
            this.players = [...(options.players || room.players || [])];

            // Inherit Room-level tracking
            this.lastStartingPlayerId = room.lastStartingPlayerId || null;
            this.impostorHistory = [...(room.impostorHistory || [])];
            this.formerPlayers = { ...room.formerPlayers };

            // Match options
            this.showImpostorHint = room.options?.showImpostorHint !== undefined
                ? room.options.showImpostorHint : true;
            this.options = options.options || room.options;

            // Language for words/roles (from Room)
            this.language = options.language || room.language || 'es';
        } else {
            // Legacy mode: first argument is hostUser
            const hostUser = roomOrHostUser;

            // Generate IDs
            this.matchId = this.generateMatchId();
            this.roomId = options.roomId || this.matchId; // For legacy compat
            this.hostId = hostUser.uid;

            // Legacy player initialization
            this.players = [];

            // Add host as first player if hostUser provided
            if (hostUser && hostUser.uid) {
                this.players.push({
                    uid: hostUser.uid,
                    name: hostUser.name,
                    photoURL: hostUser.photoURL || null,
                    joinedAt: Date.now(),
                });
            }

            // Legacy tracking
            this.lastStartingPlayerId = options.lastStartingPlayerId || null;
            this.impostorHistory = [...(options.impostorHistory || [])];
            this.formerPlayers = {};

            // Match options
            this.showImpostorHint = options.showImpostorHint !== undefined
                ? options.showImpostorHint : true;
            this.options = options;

            // Language for words/roles
            this.language = options.language || 'es';
        }

        // Timing
        this.startedAt = Date.now();

        // Match-specific state (reset each match)
        this.phase = "lobby";
        this.secretWord = "";
        this.secretCategory = "";
        this.impostorId = "";
        this.roundPlayers = [];

        // Round system
        this.currentRound = 0;
        this.maxRounds = RoundManager.MAX_ROUNDS;
        this.eliminatedPlayers = [];

        // Voting
        this.votes = {};
        this.roundHistory = [];

        // Scoring
        this.playerScores = {};
        this.lastRoundScores = {};
        this.winnerId = null;

        // Turn tracking
        this.playerOrder = [];
        this.startingPlayerId = null;

        // Initialize player scores
        this.players.forEach(p => {
            this.playerScores[p.uid] = 0;
        });

        // Update player order
        PlayerManager.updatePlayerOrder(this);
    }

    /**
     * Generate unique match ID.
     */
    generateMatchId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
    }

    /**
     * Persist match data and update player stats when match ends.
     */
    persistAnalytics(endReason = "completed") {
        const matchData = GameStateSerializer.getEnrichedGameData(this);
        matchData.endReason = endReason;

        // Calculate match duration
        const durationSeconds = Math.floor((Date.now() - this.startedAt) / 1000);

        // Save full match record to /matches collection
        dbService.saveMatch(this.matchId, matchData);

        // Update server stats (games completed + users involved)
        // Only count if it's a completed match (not cancelled)
        if (endReason === "completed") {
            statsManager.incrementGamesCompleted(this.players.length);
        }

        // Collect all unique participant IDs (current + former players who have scores)
        const participantIds = new Set([
            ...this.players.map(p => p.uid),
            ...Object.keys(this.formerPlayers).filter(uid => this.playerScores.hasOwnProperty(uid))
        ]);

        participantIds.forEach((uid) => {
            // Get player info from current list or former players
            const player = this.players.find(p => p.uid === uid) || {
                uid,
                ...this.formerPlayers[uid]
            };

            const isImpostor = this.impostorId === uid;
            const hasAbandoned = !this.players.some(p => p.uid === uid);

            // Friends win if winnerId is set to a friend (not impostor, not tie, not null)
            const friendsWon = this.winnerId &&
                this.winnerId !== this.impostorId &&
                this.winnerId !== "tie";

            const statsUpdate = {
                displayName: player.name,
                photoURL: player.photoURL || null,
                gamesPlayed: 1,
                points: this.playerScores[uid] || 0,
                playTimeSeconds: durationSeconds
            };

            // Track completion vs abandonment
            if (hasAbandoned) {
                statsUpdate.gamesAbandoned = 1;
            } else {
                statsUpdate.gamesCompleted = 1;
            }

            if (isImpostor) {
                statsUpdate.gamesAsImpostor = 1;
                // Only give win if they didn't abandon OR if you want to allow impostor wins after abandon (usually not)
                if (this.winnerId === this.impostorId && !hasAbandoned) {
                    statsUpdate.winsAsImpostor = 1;
                }
            } else {
                // All friends get winsAsFriend when friends win (and they didn't abandon)
                if (friendsWon && !hasAbandoned) {
                    statsUpdate.winsAsFriend = 1;
                }
            }

            dbService.updatePlayerStats(uid, statsUpdate);
        });
    }

    addPlayer(user) {
        PlayerManager.addPlayer(this, user);
    }

    removePlayer(userId) {
        const { newHostInfo, playerIsImpostor } = PlayerManager.removePlayer(this, userId);

        if (this.phase === "playing" && !playerIsImpostor) {
            VotingManager.checkIfAllVoted(this);
        }

        return newHostInfo;
    }

    /**
     * Iniciar el match (nueva partida completa)
     */
    startMatch(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede iniciar el match.");
        if (this.players.length < 2)
            throw new Error("Se necesitan al menos 2 jugadores para empezar.");

        // Iniciar nuevo match (reset completo + nuevo impostor)
        RoundManager.startNewMatch(this);
    }

    // Alias for compatibility during transition if needed, but we wanted clean break
    // Let's just rename it to startMatch
    startGame(userId) {
        return this.startMatch(userId);
    }

    /**
     * Continuar a la siguiente ronda (mismo impostor)
     */
    continueToNextRound(userId) {
        if (userId !== this.hostId)
            throw new Error("Solo el host puede iniciar la siguiente ronda.");
        if (this.phase !== "round_result") {
            throw new Error("Solo se puede continuar desde el resultado de ronda.");
        }
        RoundManager.startNextRound(this);
    }

    endMatch(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede terminar el match.");
        this.phase = "game_over";
        this.persistAnalytics();
    }

    /**
     * Cancel the match when host leaves.
     * No winners, no points. Special phase for UI trigger.
     */
    cancelByHost() {
        console.log(`[Match ${this.matchId}] Match cancelled by host leaving`);

        // Clear winner and scores - no one wins
        this.winnerId = null;
        this.playerScores = {};

        // Set special phase for client UI
        this.phase = "host_cancelled";

        // Persist with special end reason (no stats updates for cancelled matches)
        this.persistCancelledMatch();
    }

    /**
     * Persist match as cancelled (no winner stats).
     */
    persistCancelledMatch() {
        const matchData = GameStateSerializer.getEnrichedGameData(this);
        matchData.endReason = "host_cancelled";
        matchData.winnerId = null;

        // Save match record but don't update player stats
        dbService.saveMatch(this.matchId, matchData);
        console.log(`[Match ${this.matchId}] Cancelled match persisted (no stats updated)`);
    }

    endGame(userId) {
        return this.endMatch(userId);
    }

    /**
     * Nuevo match (reset completo de puntos, nuevo impostor)
     */
    playAgain(userId) {
        if (userId !== this.hostId)
            throw new Error("Solo el host puede empezar un nuevo match.");

        console.log(`[Match ${this.matchId}] playAgain called. Current phase: ${this.phase}`);

        // Limpiar formerPlayers para evitar crecimiento infinito del estado
        this.formerPlayers = {};
        this.players.forEach((p) => {
            this.formerPlayers[p.uid] = {
                name: p.name,
                photoURL: p.photoURL || null,
            };
        });

        // Iniciar nuevo match con reset completo
        RoundManager.startNewMatch(this);

        console.log(
            `[Match ${this.matchId}] ✅ Nuevo match iniciado. Jugadores: ${this.players.length}`
        );
    }

    castVote(voterId, targetId) {
        const result = VotingManager.castVote(this, voterId, targetId);
        return result;
    }

    getActivePlayers() {
        return PlayerManager.getActivePlayers(this);
    }

    hasVoted(playerId) {
        return VotingManager.hasVoted(this, playerId);
    }

    getStateFor(userId) {
        return GameStateSerializer.getStateForPlayer(this, userId);
    }
}

module.exports = Match;
