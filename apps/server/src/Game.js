const dbService = require("./services/db");
const PlayerManager = require("./game/PlayerManager");
const VotingManager = require("./game/VotingManager");
const RoundManager = require("./game/RoundManager");
const ScoringManager = require("./game/ScoringManager");
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

        // Sistema de vueltas
        this.currentTurn = 1;
        this.maxTurns = 3;
        this.eliminatedInRound = [];
        this.lastEliminatedInTurn = null;

        // Sistema de votación
        this.votes = {};
        this.turnHistory = [];

        // Sistema de puntos
        this.playerScores = {};
        this.roundCount = 0;
        this.initialPlayerCount = 0;
        this.maxRounds = 0;
        this.targetScore = 15;
        this.lastRoundScores = {};

        // Sistema de orden y jugador inicial
        this.playerOrder = [];
        this.startingPlayerId = null;

        // Historial de impostores
        this.impostorHistory = [];

        // Jugadores que abandonaron
        this.formerPlayers = {};

        // Persistence Debounce
        this._saveTimer = null;
        this._hasPendingChanges = false;
        this._lastSaveTime = 0;
        this.SAVE_INTERVAL_MS = 2000; // Guardar máx cada 2 segundos

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
        game.targetScore = data.targetScore || 15;
        game.initialPlayerCount = data.initialPlayerCount || 0;

        game.roundCount = data.roundCount || 0;
        game.secretWord = data.secretWord || "";
        game.secretCategory = data.secretCategory || "";
        game.impostorId = data.impostorId || "";
        game.startingPlayerId = data.startingPlayerId || null;
        game.currentTurn = data.currentTurn || 1;
        game.maxTurns = 3;
        game.lastEliminatedInTurn = null;

        game.roundPlayers = data.roundPlayers || [];
        game.eliminatedInRound = data.eliminatedInRound || [];
        game.votes = data.votes || {};
        game.turnHistory = data.turnHistory || [];
        game.lastRoundScores = data.lastRoundScores || {};
        game.playerOrder = data.playerOrder || [];
        game.impostorHistory = data.impostorHistory || [];
        game.formerPlayers = data.formerPlayers || {};

        // Inicializar debounce properties en objeto recreado
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

    getPersistenceState() {
        return GameStateSerializer.getPersistenceState(this);
    }

    /**
     * Persist game state with debounce/throttle.
     * Prevents flooding Firestore with writes during bursts (e.g. rapid voting).
     */
    persist() {
        // Marcar que hay cambios pendientes
        this._hasPendingChanges = true;

        // Si ya hay un timer corriendo, esperamos a que se ejecute (coalescing)
        if (this._saveTimer) {
            return;
        }

        const now = Date.now();
        const timeSinceLastSave = now - this._lastSaveTime;

        // Si ha pasado suficiente tiempo desde el último guardado, guardar "casi" inmediatamente
        // (usamos un pequeño delay de 100ms para agrupar cambios síncronos del mismo tick)
        if (timeSinceLastSave >= this.SAVE_INTERVAL_MS) {
            this._scheduleSave(100);
        } else {
            // Si no, programar para cuando se cumpla el intervalo
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
        // Limpiar timer y flag
        this._saveTimer = null;

        if (!this._hasPendingChanges) return;

        try {
            this._lastSaveTime = Date.now();
            this._hasPendingChanges = false; // Reset flag antes de guardar (optimistic)

            // Usar el servicio DB existente
            await dbService.saveGameState(this.gameId, this.getPersistenceState());

            // console.log(`[Game ${this.gameId}] State persisted (Throttled)`);
        } catch (error) {
            console.error(`[Game ${this.gameId}] Persist failed:`, error);
            // Si falla, restaurar flag para intentar en la siguiente llamada
            this._hasPendingChanges = true;
        }
    }

    addPlayer(user) {
        PlayerManager.addPlayer(this, user);
        this.persist();
    }

    removePlayer(userId) {
        const { newHostInfo, playerIsImpostor } = PlayerManager.removePlayer(this, userId);

        // If a regular player leaves during play, check voting
        if (this.phase === "playing" && !playerIsImpostor) {
            VotingManager.checkIfAllVoted(this);
        }

        this.persist();
        return newHostInfo;
    }

    startGame(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede iniciar la partida.");
        if (this.players.length < 2)
            throw new Error("Se necesitan al menos 2 jugadores para empezar.");

        if (this.initialPlayerCount === 0) {
            this.initialPlayerCount = this.players.length;
            this.maxRounds = 3;
        }

        this.startNewRound();
    }

    startNewRound() {
        RoundManager.startNewRound(this);
        this.persist();
    }

    endGame(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede terminar la partida.");
        this.phase = "game_over";
        this.persist();
    }

    playAgain(userId) {
        if (userId !== this.hostId) throw new Error("Solo el host puede empezar una nueva ronda.");

        console.log(`[Game ${this.gameId}] playAgain called. Current phase: ${this.phase}`);

        if (this.phase === "game_over") {
            this.playerScores = {};
            this.players.forEach((p) => {
                this.playerScores[p.uid] = 0;
            });
            this.roundCount = 0;
            this.initialPlayerCount = this.players.length;
            this.maxRounds = 3;
            this.phase = "lobby";

            // CRITICAL FIX: Limpiar formerPlayers para evitar que el estado crezca infinitamente (>1MB)
            // Solo mantenemos en formerPlayers a los jugadores que están actualmente conectados
            this.formerPlayers = {};
            this.players.forEach((p) => {
                this.formerPlayers[p.uid] = {
                    name: p.name,
                    photoURL: p.photoURL || null,
                };
            });

            console.log(
                `[Game ${this.gameId}] ✅ Nueva partida iniciada desde game_over. Memory cleaned. Jugadores: ${this.initialPlayerCount}`
            );
        } else {
            console.log(
                `[Game ${this.gameId}] Continuando con siguiente ronda. Ronda actual: ${this.roundCount}`
            );
        }

        this.startNewRound();
    }

    castVote(voterId, targetId) {
        VotingManager.castVote(this, voterId, targetId);
        // Removed persist() - votes will be saved when phase changes
        // This reduces Firestore writes by ~50%
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
