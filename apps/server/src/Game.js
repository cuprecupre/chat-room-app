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

        if (!options.isRestoring) {
            PlayerManager.addPlayer(this, hostUser);
        }
    }

    /**
     * Persist analytics data when game ends.
     */
    persistAnalytics(endReason = "completed") {
        const analyticsData = GameStateSerializer.getAnalyticsState(this);
        analyticsData.endReason = endReason;
        dbService.saveGameAnalytics(this.gameId, analyticsData);
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
