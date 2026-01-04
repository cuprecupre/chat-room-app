const PlayerManager = require("./game/PlayerManager");
const Game = require("./Game");
const dbService = require("./services/db");

/**
 * Room - Persistent game lobby that survives across multiple Game matches.
 * 
 * Architecture:
 * - Room: Persistent lobby with players (identified by roomId/code)
 * - Game: Single match within a Room (1-3 rounds, created per "Play Again")
 * 
 * Players join Rooms. When host starts, a Game is created.
 * Late joiners see "lobby_wait" phase until next Game starts.
 */
class Room {
    constructor(hostUser, options = {}) {
        // Ensure options is an object
        const opts = (options && typeof options === 'object') ? options : {};
        // Persistent Room identifier (the shareable code)
        this.roomId = this.generateRoomCode();
        this.createdBy = hostUser.uid;
        this.createdAt = Date.now();
        this.isActive = true;

        // Room-level state (persists across games)
        this.hostId = hostUser.uid;
        this.players = [];
        this.playerOrder = [];
        this.formerPlayers = {};

        // Game options (Room-level settings)
        this.options = {
            showImpostorHint: opts.showImpostorHint !== undefined
                ? opts.showImpostorHint : true,
        };

        // Rotation tracking (persists across games)
        this.lastStartingPlayerId = null;
        this.impostorHistory = [];

        // Current active game (null when in lobby)
        this.currentGame = null;

        // Room phase: "lobby" | "playing" | "game_over"
        this.phase = "lobby";

        // Add host as first player
        this.addPlayer(hostUser);

        // Persist room metadata
        this.persist();
    }

    /**
     * Generate a 10-character secure and readable room code.
     * Alphabet excludes ambiguous characters: 0, 1, I, O, L.
     */
    generateRoomCode() {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return result;
    }

    /**
     * Add a player to the Room.
     * Late joiners during a game get "lobby_wait" phase.
     */
    addPlayer(user) {
        if (this.players.some(p => p.uid === user.uid)) {
            return; // Already in room
        }

        const joinedAt = Date.now();
        let safePhotoURL = user.photoURL || null;
        if (safePhotoURL && safePhotoURL.length > 500) {
            safePhotoURL = null;
        }

        this.players.push({
            uid: user.uid,
            name: user.name,
            photoURL: safePhotoURL,
            joinedAt,
            isLateJoiner: this.phase === "playing", // Flag for late joiners
        });

        this.formerPlayers[user.uid] = {
            name: user.name,
            photoURL: safePhotoURL,
        };

        this.updatePlayerOrder();
    }

    /**
     * Remove a player from the Room.
     */
    removePlayer(userId) {
        const wasHost = this.hostId === userId;
        const leavingPlayer = this.players.find(p => p.uid === userId);

        if (leavingPlayer) {
            this.formerPlayers[userId] = {
                name: leavingPlayer.name,
                photoURL: leavingPlayer.photoURL || null,
            };
        }

        this.players = this.players.filter(p => p.uid !== userId);
        this.updatePlayerOrder();

        // Transfer host if needed
        let newHostInfo = null;
        if (wasHost && this.players.length > 0) {
            const nextHostId = this.playerOrder[0];
            if (nextHostId) {
                this.hostId = nextHostId;
                const newHost = this.players.find(p => p.uid === nextHostId);
                newHostInfo = {
                    uid: nextHostId,
                    name: newHost ? newHost.name : "Player",
                };
                console.log(`[Room ${this.roomId}] Host transferred to ${newHostInfo.name}`);
            }
        }

        // Propagate removal to current game if exists
        if (this.currentGame) {
            const gameResult = this.currentGame.removePlayer(userId);
            return { ...gameResult, newHostInfo };
        }

        return { newHostInfo };
    }

    /**
     * Update player order based on join time.
     */
    updatePlayerOrder() {
        const sortedPlayers = [...this.players].sort((a, b) => {
            return (a.joinedAt || 0) - (b.joinedAt || 0);
        });
        this.playerOrder = sortedPlayers.map(p => p.uid);
    }

    /**
     * Update room options.
     */
    updateOptions(userId, newOptions) {
        if (userId !== this.hostId) {
            throw new Error("Only the host can update room options.");
        }

        if (newOptions && typeof newOptions === "object") {
            this.options = { ...this.options, ...newOptions };
            this.persist();
        }
    }

    /**
     * Start a new Game (match) within this Room.
     */
    startGame(userId, options = {}) {
        if (userId !== this.hostId) {
            throw new Error("Only the host can start the game.");
        }
        if (this.players.length < 2) {
            throw new Error("At least 2 players needed to start.");
        }

        // Get eligible players (exclude late joiners)
        const eligiblePlayers = this.players.filter(p => !p.isLateJoiner);

        if (eligiblePlayers.length < 2) {
            throw new Error("Not enough eligible players to start.");
        }

        // Update room options if provided
        if (options.showImpostorHint !== undefined) {
            this.options.showImpostorHint = options.showImpostorHint;
            this.persist();
        }

        // Create new Game instance with Room context
        this.currentGame = new Game(this, {
            players: eligiblePlayers,
            hostId: this.hostId,
            lastStartingPlayerId: this.lastStartingPlayerId,
            impostorHistory: this.impostorHistory,
            options: this.options,
        });

        // Start the game logic (assign roles, secret word, etc.)
        this.currentGame.startGame(userId);

        this.phase = "playing";

        // Mark non-late-joiners as currently playing
        this.players.forEach(p => {
            if (!p.isLateJoiner) {
                p.isPlaying = true;
            }
        });

        console.log(`[Room ${this.roomId}] Game started with ${eligiblePlayers.length} players`);

        return this.currentGame;
    }

    /**
     * Handle game ending - update Room state.
     */
    onGameEnd(gameResult) {
        this.phase = "game_over";

        // Update rotation state for next game
        if (this.currentGame) {
            this.lastStartingPlayerId = this.currentGame.lastStartingPlayerId;
            this.impostorHistory = this.currentGame.impostorHistory;
        }

        // Reset late joiner flags - everyone can play next game
        this.players.forEach(p => {
            p.isLateJoiner = false;
            p.isPlaying = false;
        });

        console.log(`[Room ${this.roomId}] Game ended. Players ready for next match: ${this.players.length}`);
    }

    /**
     * Start a new game (Play Again).
     */
    playAgain(userId) {
        if (userId !== this.hostId) {
            throw new Error("Only the host can start a new game.");
        }

        // Reset room phase
        this.phase = "lobby";
        this.currentGame = null;

        // Clear late joiner flags
        this.players.forEach(p => {
            p.isLateJoiner = false;
        });

        // Start new game immediately
        return this.startGame(userId);
    }

    /**
     * Get the current state for a specific user.
     */
    getStateFor(userId) {
        const player = this.players.find(p => p.uid === userId);

        // If game is active, delegate to game
        if (this.currentGame && this.phase === "playing") {
            const isLateJoiner = player?.isLateJoiner;

            if (isLateJoiner) {
                // Late joiner sees lobby_wait
                return {
                    roomId: this.roomId,
                    gameId: this.currentGame.gameId,
                    hostId: this.hostId,
                    players: this.players,
                    phase: "lobby_wait",
                    playerOrder: this.playerOrder,
                };
            }

            // Active player gets game state
            return {
                roomId: this.roomId,
                ...this.currentGame.getStateFor(userId),
            };
        }

        // Lobby or game_over - return room state
        // IMPORTANT: gameId = roomId for client compatibility
        return {
            roomId: this.roomId,
            gameId: this.roomId, // Client expects gameId always
            hostId: this.hostId,
            players: this.players,
            phase: this.phase,
            playerOrder: this.playerOrder,
            options: this.options,
            // Include game_over data if available
            ...(this.phase === "game_over" && this.currentGame
                ? this.currentGame.getStateFor(userId)
                : {}),
        };
    }

    /**
     * Get count of active (non-late-joiner) players.
     */
    getActivePlayerCount() {
        return this.players.filter(p => !p.isLateJoiner).length;
    }

    /**
     * Persist room metadata to Firestore.
     */
    async persist() {
        const roomData = {
            roomId: this.roomId,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            options: this.options,
            isActive: this.isActive,
        };
        await dbService.saveRoom(this.roomId, roomData);
    }
}

module.exports = Room;
