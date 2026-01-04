const dbService = require("./services/db");
const PlayerManager = require("./game/PlayerManager");
const VotingManager = require("./game/VotingManager");
const RoundManager = require("./game/RoundManager");
const GameStateSerializer = require("./game/GameStateSerializer");

/**
 * Game - A single match (1-3 rounds) within a Room.
 * 
 * Games are ephemeral and created fresh for each "Play Again".
 * Room-level state (playerOrder, host, history) is passed in from Room.
 */
class Game {
    /**
     * Create a new Game instance.
     * @param {Room|Object} roomOrHostUser - Room instance or legacy hostUser object
     * @param {Object} options - Game options
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
            this.gameId = this.generateGameId();
            this.hostId = room.hostId;

            // Copy players from room (eligible players only)
            this.players = [...(options.players || room.players || [])];

            // Inherit Room-level tracking
            this.lastStartingPlayerId = room.lastStartingPlayerId || null;
            this.impostorHistory = [...(room.impostorHistory || [])];
            this.formerPlayers = { ...room.formerPlayers };

            // Game options
            this.showImpostorHint = room.options?.showImpostorHint !== undefined
                ? room.options.showImpostorHint : true;
            this.options = options.options || room.options;
        } else {
            // Legacy mode: first argument is hostUser
            const hostUser = roomOrHostUser;

            // Generate IDs
            this.gameId = this.generateGameId();
            this.roomId = options.roomId || this.gameId; // For legacy compat
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

            // Game options
            this.showImpostorHint = options.showImpostorHint !== undefined
                ? options.showImpostorHint : true;
            this.options = options;
        }

        // Timing
        this.startedAt = Date.now();

        // Game-specific state (reset each match)
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
     * Generate unique game ID.
     */
    generateGameId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
    }

    /**
     * Persist game data and update player stats when match ends.
     */
    persistAnalytics(endReason = "completed") {
        const gameData = GameStateSerializer.getEnrichedGameData(this);
        gameData.endReason = endReason;

        // Calculate match duration
        const durationSeconds = Math.floor((Date.now() - this.startedAt) / 1000);

        // 1. Save full game record to /games collection
        dbService.saveGame(this.gameId, gameData);

        // 2. Also save to legacy /game_analytics (optional)
        dbService.saveGameAnalytics(this.gameId, gameData);

        // 3. Aggregate player statistics
        this.players.forEach((player) => {
            const isImpostor = this.impostorId === player.uid;
            const won = this.winnerId === player.uid ||
                (this.winnerId === "amigos" && !isImpostor);

            const statsUpdate = {
                displayName: player.name,
                photoURL: player.photoURL || null,
                gamesPlayed: 1,
                points: this.playerScores[player.uid] || 0,
                playTimeSeconds: durationSeconds
            };

            if (isImpostor) {
                statsUpdate.gamesAsImpostor = 1;
                if (this.winnerId === this.impostorId) {
                    statsUpdate.winsAsImpostor = 1;
                }
            } else {
                if (this.winnerId === "amigos") {
                    statsUpdate.winsAsFriend = 1;
                }
            }

            dbService.updatePlayerStats(player.uid, statsUpdate);
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
     * Iniciar el juego (nueva partida completa)
     */
    startGame(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede iniciar la partida.");
        if (this.players.length < 2)
            throw new Error("Se necesitan al menos 2 jugadores para empezar.");

        // Iniciar nueva partida (reset completo + nuevo impostor)
        RoundManager.startNewMatch(this);
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

    endGame(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede terminar la partida.");
        this.phase = "game_over";
        this.persistAnalytics();
    }

    /**
     * Nueva partida (reset completo de puntos, nuevo impostor)
     */
    playAgain(userId) {
        if (userId !== this.hostId)
            throw new Error("Solo el host puede empezar una nueva partida.");

        console.log(`[Game ${this.gameId}] playAgain called. Current phase: ${this.phase}`);

        // Limpiar formerPlayers para evitar crecimiento infinito del estado
        this.formerPlayers = {};
        this.players.forEach((p) => {
            this.formerPlayers[p.uid] = {
                name: p.name,
                photoURL: p.photoURL || null,
            };
        });

        // Iniciar nueva partida con reset completo
        RoundManager.startNewMatch(this);

        console.log(
            `[Game ${this.gameId}] ✅ Nueva partida iniciada. Jugadores: ${this.players.length}`
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

module.exports = Game;
