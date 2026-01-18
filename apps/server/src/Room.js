const PlayerManager = require("./game/PlayerManager");
const Match = require("./Match");
const dbService = require("./services/db");

/**
 * Room - Persistent game lobby that survives across multiple Game matches.
 * 
 * Architecture:
 * - Room: Persistent lobby with players (identified by roomId/code)
 * - Match: Single match within a Room (1-3 rounds, created per "Play Again")
 * 
 * Players join Rooms. When host starts, a Match is created.
 * Late joiners see "lobby_wait" phase until next Match starts.
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

        // Match options (Room-level settings)
        this.options = {
            showImpostorHint: opts.showImpostorHint !== undefined
                ? opts.showImpostorHint : true,
            gameMode: opts.gameMode || 'voice', // 'voice' | 'chat'
        };

        // Room language (set by host, used for words/roles)
        this.language = opts.language || 'es';

        // Rotation tracking (persists across matches)
        this.lastStartingPlayerId = null;
        this.impostorHistory = [];

        // Current active match (null when in lobby)
        this.currentMatch = null;

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
        const existingPlayer = this.players.find(p => p.uid === user.uid);

        let safePhotoURL = user.photoURL || null;
        if (safePhotoURL && safePhotoURL.length > 500) {
            safePhotoURL = null;
        }

        if (existingPlayer) {
            // Update info if player already in room
            existingPlayer.name = user.name || existingPlayer.name;
            existingPlayer.photoURL = safePhotoURL || existingPlayer.photoURL;

            // Also update formerPlayers copy
            this.formerPlayers[user.uid] = {
                name: existingPlayer.name,
                photoURL: existingPlayer.photoURL,
            };
            return;
        }

        const joinedAt = Date.now();

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

        // Propagate removal to current match if exists
        if (this.currentMatch) {
            const matchResult = this.currentMatch.removePlayer(userId);

            // Si la partida terminó por falta de jugadores, actualizar fase de Room
            if (matchResult.matchEnded) {
                this.onMatchEnd();
            }

            return { ...matchResult, newHostInfo };
        }

        return { newHostInfo };
    }

    /**
     * Kick a player from the room (host only).
     * The player is removed from both Room and any active Match.
     */
    kickPlayer(hostId, targetId) {
        // Validate host
        if (hostId !== this.hostId) {
            throw new Error("Solo el anfitrión puede expulsar jugadores.");
        }

        // Prevent self-kick
        if (hostId === targetId) {
            throw new Error("No puedes expulsarte a ti mismo.");
        }

        // Find target player
        const targetPlayer = this.players.find(p => p.uid === targetId);
        if (!targetPlayer) {
            throw new Error("Jugador no encontrado en la sala.");
        }


        // Remove player from room (and match if applicable)
        const removeResult = this.removePlayer(targetId);

        return {
            kicked: true,
            kickedPlayer: {
                uid: targetId,
                name: targetPlayer.name,
            },
            ...removeResult,
        };
    }

    /**
     * Remove a player from the current Match but keep them in the Room.
     * Used for "Ir a la sala" button.
     * If the HOST leaves the match, the match is CANCELLED for everyone.
     */
    leaveMatch(userId) {
        const player = this.players.find(p => p.uid === userId);
        if (!player) return { error: "Player not found in room" };

        // Mark as late joiner so they wait for the next match
        player.isLateJoiner = true;
        player.isPlaying = false;

        if (this.currentMatch) {
            // If the Room HOST leaves the match, cancel the match for everyone
            if (userId === this.hostId) {
                console.log(`[Room ${this.roomId}] Host ${player.name} abandoned match - cancelling for all players`);
                this.currentMatch.cancelByHost();
                this.onMatchEnd();
                return { hostCancelled: true };
            }

            // During game_over, don't remove from match - just mark as wanting to return to lobby
            // This preserves match data (impostor, secret word) for other players

            const result = this.currentMatch.removePlayer(userId);
            return result;
        }

        return {};
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

            // Update language if provided in options (e.g. from Lobby)
            if (newOptions.language) {
                this.language = newOptions.language;
            }

            this.persist();
        }
    }

    /**
     * Start a new Match within this Room.
     */
    startMatch(userId, options = {}) {
        if (userId !== this.hostId) {
            console.error(`[Room ${this.roomId}] startMatch denied: userId=${userId} !== hostId=${this.hostId}`);
            throw new Error("Only the host can start a new match.");
        }
        if (this.players.length < 3) {
            throw new Error("Se necesitan al menos 3 jugadores para comenzar.");
        }

        // Get eligible players (exclude late joiners)
        const eligiblePlayers = this.players.filter(p => !p.isLateJoiner);

        if (eligiblePlayers.length < 3) {
            throw new Error("Se necesitan al menos 3 jugadores para comenzar.");
        }

        // Update room options if provided
        if (options.showImpostorHint !== undefined) {
            this.options.showImpostorHint = options.showImpostorHint;
            this.persist();
        }

        // Clear previous match before creating new one
        this.currentMatch = null;

        // Create new Match instance with Room context
        this.currentMatch = new Match(this, {
            players: eligiblePlayers,
            hostId: this.hostId,
            lastStartingPlayerId: this.lastStartingPlayerId,
            impostorHistory: this.impostorHistory,
            options: this.options,
            language: this.language,
        });

        // Start the match logic (assign roles, secret word, etc.)
        this.currentMatch.startMatch(userId);

        this.phase = "playing";

        // Mark non-late-joiners as currently playing
        this.players.forEach(p => {
            if (!p.isLateJoiner) {
                p.isPlaying = true;
            }
        });

        console.log(`[Room ${this.roomId}] Match started with ${eligiblePlayers.length} players`);

        return this.currentMatch;
    }

    // Keep startGame for internal compatibility if needed, but we should update it
    startGame(userId, options = {}) {
        return this.startMatch(userId, options);
    }

    /**
     * Handle match ending - update Room state.
     * For host_cancelled: Keep phase so client shows farewell screen,
     * then auto-transition to lobby after delay.
     */
    onMatchEnd(matchResult) {
        // Check if match was cancelled by host
        const wasHostCancelled = this.currentMatch?.phase === "host_cancelled";

        // Update rotation state for next match (before clearing)
        if (this.currentMatch) {
            this.lastStartingPlayerId = this.currentMatch.lastStartingPlayerId;
            this.impostorHistory = this.currentMatch.impostorHistory;
        }

        // IMPORTANT: Do NOT clear currentMatch yet - we need it for game_over screen data
        // It will be cleared when starting a new match or returning to lobby

        // Reset late joiner flags - but ONLY for players who participated until the end
        // Players who left the match early (isLateJoiner=true) should keep that flag
        // so they see "lobby" phase instead of corrupted "game_over" data
        this.players.forEach(p => {
            // Don't reset isLateJoiner if player already left the match voluntarily
            // They should stay in "lobby" view, not see game_over with missing data
            p.isPlaying = false;
        });

        if (wasHostCancelled) {
            // Keep host_cancelled phase so client shows farewell UI
            this.phase = "host_cancelled";
            console.log(`[Room ${this.roomId}] Match cancelled by host. Farewell screen will show.`);

            // Auto-transition to lobby after 5 seconds
            setTimeout(() => {
                if (this.phase === "host_cancelled") {
                    this.phase = "lobby";
                    this.currentMatch = null; // Clear match when returning to lobby
                    // Note: roomManager.emitRoomState should be called here,
                    // but we don't have access to it. Client will request state.
                }
            }, 5000);
        } else {
            this.phase = "game_over";
        }

    }

    // Alias for compatibility
    onGameEnd(gameResult) {
        return this.onMatchEnd(gameResult);
    }

    /**
     * Start a new match (Play Again).
     */
    playAgain(userId) {
        if (userId !== this.hostId) {
            console.error(`[Room ${this.roomId}] playAgain denied: userId=${userId} !== hostId=${this.hostId}`);
            throw new Error("Only the host can start a new match.");
        }

        // Validar jugadores mínimos ANTES de resetear
        const eligiblePlayers = this.players.filter(p => !p.isLateJoiner);
        if (eligiblePlayers.length < 3) {
            throw new Error("Se necesitan al menos 3 jugadores para comenzar una nueva partida.");
        }

        // Reset room phase
        this.phase = "lobby";
        this.currentMatch = null;

        // Clear late joiner flags
        this.players.forEach(p => {
            p.isLateJoiner = false;
        });

        // Start new match immediately
        return this.startMatch(userId);
    }

    /**
     * Get the current state for a specific user.
     */
    getStateFor(userId) {
        const player = this.players.find(p => p.uid === userId);

        // If match is active, delegate to match
        if (this.currentMatch && this.phase === "playing") {
            const isLateJoiner = player?.isLateJoiner;

            if (isLateJoiner) {
                // Late joiner sees lobby_wait
                return {
                    roomId: this.roomId,
                    matchId: this.currentMatch.matchId,
                    gameId: this.currentMatch.matchId, // For legacy client compatibility
                    hostId: this.hostId,
                    players: this.players,
                    phase: "lobby_wait",
                    playerOrder: this.playerOrder,
                };
            }

            // Active player gets match state
            return {
                roomId: this.roomId,
                ...this.currentMatch.getStateFor(userId),
            };
        }

        // Lobby or game_over - return room state
        // If room is in game_over but player has left the results (isLateJoiner=true),
        // show them the lobby phase instead.
        let displayPhase = this.phase;
        if (displayPhase === "game_over" && player?.isLateJoiner) {
            displayPhase = "lobby";
        }

        // IMPORTANT: matchId = roomId for client compatibility
        return {
            roomId: this.roomId,
            matchId: this.roomId,
            gameId: this.roomId, // Client expects gameId always
            hostId: this.hostId,
            players: this.players,
            phase: displayPhase,
            playerOrder: this.playerOrder,
            options: this.options,
            // Include game_over data if available (only for players still viewing results)
            ...(displayPhase === "game_over" && this.currentMatch
                ? this.currentMatch.getStateFor(userId)
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
