const dbService = require("./services/db");
const PlayerManager = require("./game/PlayerManager");
const VotingManager = require("./game/VotingManager");
const RoundManager = require("./game/RoundManager");
const GameStateSerializer = require("./game/GameStateSerializer");

class Game {
    constructor(hostUser, options = {}) {
        this.gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.hostId = hostUser.uid;
        this.players = [];
        this.phase = "lobby";
        this.secretWord = "";
        this.secretCategory = "";
        this.impostorId = "";
        this.roundPlayers = [];

        // Opciones del juego
        this.showImpostorHint =
            options.showImpostorHint !== undefined ? options.showImpostorHint : true;

        // Sistema de rondas (nuevo: sin vueltas)
        this.currentRound = 0;
        this.maxRounds = RoundManager.MAX_ROUNDS; // 3
        this.eliminatedPlayers = [];

        // Sistema de votación
        this.votes = {};
        this.roundHistory = [];

        // Sistema de puntos
        this.playerScores = {};
        this.lastRoundScores = {};
        this.winnerId = null;

        // Sistema de orden y jugador inicial
        this.playerOrder = [];
        this.startingPlayerId = null;

        // Historial de impostores (para evitar repeticiones entre partidas)
        this.impostorHistory = [];

        // Jugadores que abandonaron
        this.formerPlayers = {};

        // Schema version para detectar partidas antiguas
        // v1: sistema con turnos (currentTurn, maxTurns)
        // v2: sistema con rondas (currentRound, maxRounds)
        this.schemaVersion = 2;

        // Persistence Debounce
        this._saveTimer = null;
        this._hasPendingChanges = false;
        this._lastSaveTime = 0;
        this.SAVE_INTERVAL_MS = 2000;

        if (!options.isRestoring) {
            PlayerManager.addPlayer(this, hostUser);
            this.persist();
        }
    }

    static fromState(gameId, data) {
        const game = Object.create(Game.prototype);

        game.gameId = gameId;
        game.hostId = data.hostId;
        game.phase = data.phase;

        game.players = (data.players || []).map((p) => ({
            ...p,
            photoURL: p.photoURL || null,
        }));
        game.playerScores = data.playerScores || {};

        game.showImpostorHint = data.showImpostorHint !== undefined ? data.showImpostorHint : true;
        game.maxRounds = data.maxRounds || 3;

        // Obtener schemaVersion (partidas viejas no tienen este campo)
        game.schemaVersion = data.schemaVersion || 1;

        // MIGRACIÓN: Detectar sistema antiguo
        // - schemaVersion < 2 = sistema viejo
        // - tiene currentTurn pero no currentRound = sistema viejo
        const isOldSchema = game.schemaVersion < 2;
        const isOldSystem = data.currentTurn !== undefined && data.currentRound === undefined;
        const needsMigration = isOldSchema || isOldSystem;

        if (needsMigration) {
            console.log(
                `[Game ${gameId}] ⚠️ OLD SYSTEM DETECTED (schemaVersion=${game.schemaVersion}) - Setting needs_migration`
            );
            game.phase = "needs_migration";
            game.currentRound = 0;
            game.eliminatedPlayers = [];
            game.roundHistory = [];
            game.winnerId = null;
            game.migratedFromOldSystem = true;
        } else {
            // Sistema nuevo
            game.currentRound = data.currentRound || 0;
            game.eliminatedPlayers = data.eliminatedPlayers || [];
            game.roundHistory = data.roundHistory || [];
            game.winnerId = data.winnerId || null;
            game.migratedFromOldSystem = false;
        }

        game.secretWord = data.secretWord || "";
        game.secretCategory = data.secretCategory || "";
        game.impostorId = data.impostorId || "";
        game.startingPlayerId = data.startingPlayerId || null;

        game.roundPlayers = data.roundPlayers || [];

        // MIGRACIÓN: Detectar partidas corruptas
        // 1. En playing pero sin roundPlayers
        // 2. En playing pero roundPlayers tiene IDs que no existen en players
        const playerUids = game.players.map((p) => p.uid);
        const invalidRoundPlayers = game.roundPlayers.filter((uid) => !playerUids.includes(uid));
        const hasNoValidRoundPlayers = game.phase === "playing" && game.roundPlayers.length === 0;
        const hasInvalidRoundPlayers = game.phase === "playing" && invalidRoundPlayers.length > 0;
        const isCorruptedGame = hasNoValidRoundPlayers || hasInvalidRoundPlayers;

        if (isCorruptedGame) {
            console.log(`[Game ${gameId}] ⚠️ CORRUPTED GAME DETECTED - Setting needs_migration`);
            console.log(`[Game ${gameId}]   - roundPlayers: ${JSON.stringify(game.roundPlayers)}`);
            console.log(`[Game ${gameId}]   - playerUids: ${JSON.stringify(playerUids)}`);
            console.log(
                `[Game ${gameId}]   - invalidRoundPlayers: ${JSON.stringify(invalidRoundPlayers)}`
            );
            game.phase = "needs_migration";
            game.currentRound = 0;
            game.winnerId = null;
            game.migratedFromOldSystem = true;
        }
        game.votes = data.votes || {};
        game.lastRoundScores = data.lastRoundScores || {};
        game.playerOrder = data.playerOrder || [];
        game.impostorHistory = data.impostorHistory || [];
        game.formerPlayers = data.formerPlayers || {};

        // Inicializar debounce properties
        game._saveTimer = null;
        game._hasPendingChanges = false;
        game._lastSaveTime = 0;
        game.SAVE_INTERVAL_MS = 2000;

        console.log(
            `[Game Recovery] Game ${gameId} restored in phase '${game.phase}' with ${game.players.length} players:`,
            game.players.map((p) => p.name).join(", ")
        );
        return game;
    }

    /**
     * Migra partidas en memoria con el sistema antiguo al nuevo.
     * Retorna true si la partida fue migrada (terminada).
     */
    migrateIfOldSystem() {
        // Detectar sistema antiguo: tiene currentTurn pero no currentRound
        const isOldSystem = this.currentTurn !== undefined && this.currentRound === undefined;

        if (isOldSystem) {
            console.log(`[Game ${this.gameId}] ⚠️ MIGRATING IN-MEMORY GAME - Forcing game_over`);

            // Convertir propiedades
            this.currentRound = 3;
            this.eliminatedPlayers = this.eliminatedInRound || [];
            this.roundHistory = this.turnHistory || [];
            this.winnerId = null;
            this.migratedFromOldSystem = true;

            // Limpiar propiedades viejas
            delete this.currentTurn;
            delete this.maxTurns;
            delete this.eliminatedInRound;
            delete this.turnHistory;
            delete this.lastEliminatedInTurn;

            // Terminar la partida
            this.phase = "game_over";
            this.persist();

            return true;
        }

        return false;
    }

    getPersistenceState() {
        return GameStateSerializer.getPersistenceState(this);
    }

    persist() {
        this._hasPendingChanges = true;

        if (this._saveTimer) {
            return;
        }

        const now = Date.now();
        const timeSinceLastSave = now - this._lastSaveTime;

        if (timeSinceLastSave >= this.SAVE_INTERVAL_MS) {
            this._scheduleSave(100);
        } else {
            const delay = this.SAVE_INTERVAL_MS - timeSinceLastSave;
            this._scheduleSave(delay);
        }
    }

    _scheduleSave(delay) {
        this._saveTimer = setTimeout(() => {
            this._performSave();
        }, delay);
    }

    async _performSave() {
        this._saveTimer = null;

        if (!this._hasPendingChanges) return;

        try {
            this._lastSaveTime = Date.now();
            this._hasPendingChanges = false;

            await dbService.saveGameState(this.gameId, this.getPersistenceState());
        } catch (error) {
            console.error(`[Game ${this.gameId}] Persist failed:`, error);
            this._hasPendingChanges = true;
        }
    }

    addPlayer(user) {
        PlayerManager.addPlayer(this, user);
        this.persist();
    }

    removePlayer(userId) {
        const { newHostInfo, playerIsImpostor } = PlayerManager.removePlayer(this, userId);

        if (this.phase === "playing" && !playerIsImpostor) {
            VotingManager.checkIfAllVoted(this);
        }

        this.persist();
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
        this.persist();
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
        // Migrar partidas con sistema antiguo (previene errores de undefined)
        if (this.migrateIfOldSystem()) {
            throw new Error("Esta partida ha sido actualizada. Por favor, inicia una nueva.");
        }
        const result = VotingManager.castVote(this, voterId, targetId);
        this.persist();
        return result;
    }

    getActivePlayers() {
        return PlayerManager.getActivePlayers(this);
    }

    hasVoted(playerId) {
        return VotingManager.hasVoted(this, playerId);
    }

    getStateFor(userId) {
        // Migrar partidas con sistema antiguo automáticamente
        this.migrateIfOldSystem();
        return GameStateSerializer.getStateForPlayer(this, userId);
    }
}

module.exports = Game;
