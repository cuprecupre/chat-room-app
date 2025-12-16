const { getRandomWordWithCategory } = require('./words');
const dbService = require('./server/services/db');

// Schema version for migration
const SCHEMA_VERSION = 2;

// Player status constants
const PLAYER_STATUS = {
  ACTIVE: 'active',
  LEFT: 'left',
  WAITING_REJOIN: 'waiting_rejoin'
};

class Game {
  constructor(hostUser, options = {}) {
    this.gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.hostId = hostUser.uid;
    this.schemaVersion = SCHEMA_VERSION;

    // NEW: Players is now an object keyed by UID with status tracking
    // Format: { [uid]: { name, photoURL, status, joinedAt, leftAt, isHost } }
    this.players = {};

    this.phase = 'lobby'; // lobby, playing, round_result, game_over
    this.secretWord = '';
    this.secretCategory = '';
    this.impostorId = '';
    this.roundPlayers = []; // uids activos en la ronda actual

    // Opciones del juego
    const safeOptions = options || {};
    this.showImpostorHint = safeOptions.showImpostorHint !== undefined ? safeOptions.showImpostorHint : true;

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

    // Legacy: formerPlayers for backward compatibility
    this.formerPlayers = {};

    if (!options.isRestoring) {
      this.addPlayer(hostUser);
      this.persist();
    }
  }

  // ============ HELPER METHODS FOR NEW PLAYER STRUCTURE ============

  /**
   * Get a player by UID
   * @param {string} uid 
   * @returns {Object|null}
   */
  getPlayer(uid) {
    return this.players[uid] || null;
  }

  /**
   * Get all active players (status === 'active')
   * @returns {Array} Array of player objects with uid included
   */
  getActivePlayersArray() {
    return Object.entries(this.players)
      .filter(([uid, p]) => p.status === PLAYER_STATUS.ACTIVE)
      .map(([uid, p]) => ({ uid, ...p }));
  }

  /**
   * Get all active player UIDs
   * @returns {Array<string>}
   */
  getActivePlayerUids() {
    return Object.entries(this.players)
      .filter(([uid, p]) => p.status === PLAYER_STATUS.ACTIVE)
      .map(([uid]) => uid);
  }

  /**
   * Get player count (active only)
   * @returns {number}
   */
  getActivePlayerCount() {
    return this.getActivePlayerUids().length;
  }

  /**
   * Check if a player exists and is active
   * @param {string} uid 
   * @returns {boolean}
   */
  isPlayerActive(uid) {
    return this.players[uid]?.status === PLAYER_STATUS.ACTIVE;
  }

  /**
   * Set player status
   * @param {string} uid 
   * @param {string} status - 'active', 'left', 'waiting_rejoin'
   */
  setPlayerStatus(uid, status) {
    if (this.players[uid]) {
      this.players[uid].status = status;
      if (status === PLAYER_STATUS.LEFT) {
        this.players[uid].leftAt = Date.now();
      }
      console.log(`[Game ${this.gameId}] Player ${this.players[uid].name} status -> ${status}`);
    }
  }

  /**
   * Convert players object to array format for client compatibility
   * Only returns active players
   * @returns {Array}
   */
  getPlayersAsArray() {
    return this.getActivePlayersArray();
  }

  /**
   * Reconstructs a Game instance from a plain object (database state).
   * @param {string} gameId
   * @param {Object} data 
   */
  /**
   * Migrate old array-based players to new object format
   * @param {Array} playersArray 
   * @returns {Object}
   */
  static migratePlayersToObject(playersArray) {
    const playersObj = {};
    playersArray.forEach(p => {
      playersObj[p.uid] = {
        name: p.name,
        photoURL: p.photoURL || null,
        status: PLAYER_STATUS.ACTIVE,
        joinedAt: p.joinedAt || Date.now(),
        leftAt: null,
        isHost: false // Will be set correctly after
      };
    });
    return playersObj;
  }

  /**
   * Reconstructs a Game instance from a plain object (database state).
   * Includes on-the-fly migration for old schema versions.
   */
  static fromState(gameId, data) {
    const game = Object.create(Game.prototype);

    game.gameId = gameId;
    game.hostId = data.hostId;
    game.phase = data.phase;
    game.schemaVersion = data.schemaVersion || 1;

    // MIGRATION: Detect old format (players is array) and convert
    if (Array.isArray(data.players)) {
      console.log(`[Migration] Converting game ${gameId} from schema v1 to v${SCHEMA_VERSION}`);
      game.players = Game.migratePlayersToObject(data.players);
      game.schemaVersion = SCHEMA_VERSION;
      // Mark host
      if (game.players[data.hostId]) {
        game.players[data.hostId].isHost = true;
      }
    } else {
      // New format - use directly
      game.players = data.players || {};
    }

    game.playerScores = data.playerScores || {};

    // Config
    game.showImpostorHint = data.showImpostorHint !== undefined ? data.showImpostorHint : true;
    game.maxRounds = data.maxRounds || 3;
    game.targetScore = data.targetScore || 15;
    game.initialPlayerCount = data.initialPlayerCount || 0;

    // Round State
    game.roundCount = data.roundCount || 0;
    game.secretWord = data.secretWord || '';
    game.secretCategory = data.secretCategory || '';
    game.impostorId = data.impostorId || '';
    game.startingPlayerId = data.startingPlayerId || null;
    game.currentTurn = data.currentTurn || 1;
    game.maxTurns = 3;
    game.lastEliminatedInTurn = null;

    // Arrays & Collections
    game.roundPlayers = data.roundPlayers || [];
    game.eliminatedInRound = data.eliminatedInRound || [];
    game.votes = data.votes || {};
    game.turnHistory = data.turnHistory || [];
    game.lastRoundScores = data.lastRoundScores || {};
    game.playerOrder = data.playerOrder || [];
    game.impostorHistory = data.impostorHistory || [];
    game.formerPlayers = data.formerPlayers || {};

    const activeCount = game.getActivePlayerCount();
    console.log(`[Game Recovery] Game ${gameId} restored in phase '${game.phase}' with ${activeCount} active players`);
    return game;
  }

  // --- Persistence Helpers ---
  getPersistenceState() {
    return {
      schemaVersion: this.schemaVersion,
      hostId: this.hostId,
      phase: this.phase,
      players: this.players,  // Now an object with status
      playerScores: this.playerScores,

      // Game Config
      showImpostorHint: this.showImpostorHint,
      maxRounds: this.maxRounds,
      targetScore: this.targetScore,
      initialPlayerCount: this.initialPlayerCount,

      // Round State
      roundCount: this.roundCount,
      secretWord: this.secretWord,
      secretCategory: this.secretCategory,
      impostorId: this.impostorId,
      startingPlayerId: this.startingPlayerId,
      currentTurn: this.currentTurn,

      // Arrays & Objects
      roundPlayers: this.roundPlayers,
      eliminatedInRound: this.eliminatedInRound,
      votes: this.votes,
      turnHistory: this.turnHistory,
      lastRoundScores: this.lastRoundScores,
      playerOrder: this.playerOrder,
      impostorHistory: this.impostorHistory,
      formerPlayers: this.formerPlayers
    };
  }

  persist() {
    // Fire and forget - don't block game loop
    dbService.saveGameState(this.gameId, this.getPersistenceState());
  }

  addPlayer(user) {
    const existingPlayer = this.players[user.uid];

    // If player exists but left, handle rejoin
    if (existingPlayer) {
      if (existingPlayer.status === PLAYER_STATUS.LEFT) {
        // Player is rejoining - check game phase
        if (this.phase === 'lobby') {
          // Lobby: can rejoin immediately as active
          this.setPlayerStatus(user.uid, PLAYER_STATUS.ACTIVE);
          console.log(`[Game ${this.gameId}] Player ${user.name} rejoined (was left, now active)`);
        } else {
          // Game in progress: set as waiting_rejoin
          this.setPlayerStatus(user.uid, PLAYER_STATUS.WAITING_REJOIN);
          console.log(`[Game ${this.gameId}] Player ${user.name} set to waiting_rejoin (game in progress)`);
        }
        // Update player info in case it changed
        this.players[user.uid].name = user.name;
        this.players[user.uid].photoURL = user.photoURL || null;
        this.updatePlayerOrder();
        this.persist();
        return;
      } else if (existingPlayer.status === PLAYER_STATUS.ACTIVE) {
        // Already active - but update name/photo in case they changed
        this.players[user.uid].name = user.name;
        this.players[user.uid].photoURL = user.photoURL || null;
        this.formerPlayers[user.uid] = {
          name: user.name,
          photoURL: user.photoURL || null
        };
        this.persist();
        console.log(`[Game ${this.gameId}] Player ${user.name} already active (name/photo updated)`);
        return;
      } else if (existingPlayer.status === PLAYER_STATUS.WAITING_REJOIN) {
        // Player is reconnecting - change status back to ACTIVE
        this.players[user.uid].name = user.name;
        this.players[user.uid].photoURL = user.photoURL || null;
        this.players[user.uid].status = PLAYER_STATUS.ACTIVE;
        this.formerPlayers[user.uid] = {
          name: user.name,
          photoURL: user.photoURL || null
        };
        this.persist();
        console.log(`[Game ${this.gameId}] Player ${user.name} reconnected (waiting_rejoin -> active)`);
        return;
      }
    }

    // New player
    const joinedAt = Date.now();
    this.players[user.uid] = {
      name: user.name,
      photoURL: user.photoURL || null,
      status: PLAYER_STATUS.ACTIVE,
      joinedAt: joinedAt,
      leftAt: null,
      isHost: Object.keys(this.players).length === 0 // First player is host
    };

    // Backup for former players display
    this.formerPlayers[user.uid] = {
      name: user.name,
      photoURL: user.photoURL || null
    };

    // Initialize score
    if (this.playerScores[user.uid] === undefined) {
      this.playerScores[user.uid] = 0;
    }

    // Update order
    this.updatePlayerOrder();
    this.persist();

    console.log(`[Game ${this.gameId}] Player ${user.name} joined as active`);
  }

  /**
   * Actualiza el orden base (OB) ordenando jugadores activos por joinedAt (ASC)
   */
  updatePlayerOrder() {
    // Get active AND waiting_rejoin players and sort by joinedAt
    // We include waiting_rejoin so they appear in the player list UI
    const playersList = Object.entries(this.players)
      .filter(([uid, p]) => p.status === PLAYER_STATUS.ACTIVE || p.status === PLAYER_STATUS.WAITING_REJOIN)
      .map(([uid, p]) => ({ uid, ...p }));

    const sortedPlayers = playersList.sort((a, b) => {
      return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
    this.playerOrder = sortedPlayers.map(p => p.uid);
    console.log(`[Game ${this.gameId}] Orden base actualizado:`, this.playerOrder);
  }

  /**
   * Calcula el jugador que inicia la ronda actual
   * Fórmula: ((roundCount - 1) mod N) donde N es el número de jugadores elegibles
   * @returns {string|null} UID del jugador inicial o null si no hay jugadores elegibles
   */
  calculateStartingPlayer() {
    // Jugadores elegibles: activos en la ronda (no expulsados definitivamente)
    // Para simplificar: elegibles = jugadores que están en roundPlayers
    const eligiblePlayers = this.playerOrder.filter(uid =>
      this.roundPlayers.includes(uid)
    );

    if (eligiblePlayers.length === 0) {
      console.log(`[Game ${this.gameId}] No hay jugadores elegibles para iniciar ronda`);
      return null;
    }

    // Calcular índice usando la fórmula: ((r - 1) mod N)
    const roundIndex = (this.roundCount - 1) % eligiblePlayers.length;
    const startingPlayerId = eligiblePlayers[roundIndex];

    const startingPlayer = this.getPlayer(startingPlayerId);
    console.log(`[Game ${this.gameId}] Ronda ${this.roundCount}: Jugador inicial = ${startingPlayer?.name} (índice ${roundIndex} de ${eligiblePlayers.length} elegibles)`);

    return startingPlayerId;
  }

  /**
   * Selecciona un impostor evitando que el mismo jugador sea impostor más de 2 veces consecutivas
   * @returns {string} UID del jugador seleccionado como impostor
   */
  selectImpostorWithLimit() {
    // Obtener los últimos 2 impostores del historial
    const lastTwoImpostors = this.impostorHistory.slice(0, 2);

    // Verificar si ambas últimas veces fue el mismo jugador
    let excludedPlayer = null;
    if (lastTwoImpostors.length === 2 && lastTwoImpostors[0] === lastTwoImpostors[1]) {
      excludedPlayer = lastTwoImpostors[0];
      const excludedPlayerData = this.getPlayer(excludedPlayer);
      console.log(`[Game ${this.gameId}] Jugador ${excludedPlayerData?.name} fue impostor las últimas 2 veces, será excluido`);
    }

    // Crear lista de candidatos (jugadores activos que no están excluidos)
    let candidates = this.roundPlayers.filter(uid => uid !== excludedPlayer);

    // Si no hay candidatos (caso extremo: solo hay 1 jugador o algo salió mal)
    // Permitir a cualquiera ser impostor
    if (candidates.length === 0) {
      console.log(`[Game ${this.gameId}] No hay candidatos elegibles, permitiendo a todos`);
      candidates = [...this.roundPlayers];
    }

    // Seleccionar impostor con mejor aleatoriedad usando Fisher-Yates shuffle
    const shuffledCandidates = [...candidates];
    for (let i = shuffledCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCandidates[i], shuffledCandidates[j]] = [shuffledCandidates[j], shuffledCandidates[i]];
    }

    return shuffledCandidates[0];
  }

  /**
   * Mark player as left (not removed from object)
   * @param {string} userId 
   * @returns {Object|null} newHostInfo if host changed
   */
  leaveGame(userId) {
    const player = this.getPlayer(userId);

    // Allow leaving if player is ACTIVE or WAITING_REJOIN
    // Only prevent if player is already LEFT or doesn't exist
    if (!player || player.status === PLAYER_STATUS.LEFT) {
      console.log(`[Game ${this.gameId}] Player ${userId} cannot leave (already left or not found)`);
      return null;
    }

    const playerIsImpostor = this.impostorId === userId;
    const wasHost = this.hostId === userId;

    // Update formerPlayers backup
    this.formerPlayers[userId] = {
      name: player.name,
      photoURL: player.photoURL || null
    };

    // Set status to LEFT (player stays in object for historical data)
    this.setPlayerStatus(userId, PLAYER_STATUS.LEFT);

    // Remove from active round
    this.roundPlayers = this.roundPlayers.filter(uid => uid !== userId);
    this.eliminatedInRound = this.eliminatedInRound.filter(uid => uid !== userId);
    delete this.votes[userId];
    // playerScores preserved

    // Update player order
    this.updatePlayerOrder();

    // Transfer host if needed
    let newHostInfo = null;
    const activePlayerCount = this.getActivePlayerCount();
    if (wasHost && activePlayerCount > 0) {
      const nextHostId = this.playerOrder.find(uid => this.isPlayerActive(uid));
      if (nextHostId) {
        this.hostId = nextHostId;
        if (this.players[nextHostId]) {
          this.players[nextHostId].isHost = true;
        }
        const newHost = this.getPlayer(nextHostId);
        newHostInfo = {
          uid: nextHostId,
          name: newHost ? newHost.name : 'Jugador'
        };
        console.log(`[Game ${this.gameId}] Host transferido a ${newHostInfo.name} (${nextHostId})`);
      }
    }

    // Handle game phase impact
    if (this.phase === 'playing' && playerIsImpostor) {
      this.phase = 'round_result';
    } else if (this.phase === 'playing') {
      this.checkIfAllVoted();
    }

    this.persist();
    console.log(`[Game ${this.gameId}] Player ${player.name} left game`);

    return newHostInfo;
  }

  // Legacy alias for backward compatibility
  removePlayer(userId) {
    return this.leaveGame(userId);
  }

  startGame(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede iniciar la partida.');
    const activeCount = this.getActivePlayerCount();
    if (activeCount < 2) throw new Error('Se necesitan al menos 2 jugadores para empezar.');

    // Establecer máximo de rondas en el primer inicio
    if (this.initialPlayerCount === 0) {
      this.initialPlayerCount = activeCount;
      this.maxRounds = 3;
    }

    // Activate any waiting_rejoin players
    Object.entries(this.players).forEach(([uid, p]) => {
      if (p.status === PLAYER_STATUS.WAITING_REJOIN) {
        this.setPlayerStatus(uid, PLAYER_STATUS.ACTIVE);
      }
    });

    this.startNewRound();
  }

  startNewRound() {
    // Active players participate in round
    this.roundPlayers = this.getActivePlayerUids();
    this.currentTurn = 1;
    this.eliminatedInRound = [];
    this.lastEliminatedInTurn = null;
    this.votes = {};
    this.turnHistory = [];
    this.lastRoundScores = {};
    this.roundCount++;

    // Calcular jugador inicial para esta ronda
    this.startingPlayerId = this.calculateStartingPlayer();

    // Seleccionar impostor evitando que alguien sea impostor más de 2 veces seguidas
    this.impostorId = this.selectImpostorWithLimit();

    // Agregar el nuevo impostor al historial
    this.impostorHistory.unshift(this.impostorId);
    // Mantener solo los últimos 10 registros para evitar memoria infinita
    if (this.impostorHistory.length > 10) {
      this.impostorHistory = this.impostorHistory.slice(0, 10);
    }

    // Seleccionar palabra
    const { word, category } = getRandomWordWithCategory();
    this.secretWord = word;
    this.secretCategory = category;

    const impostorPlayer = this.getPlayer(this.impostorId);
    const impostorName = impostorPlayer?.name || 'desconocido';
    console.log(`[Game ${this.gameId}] Ronda ${this.roundCount}: palabra='${this.secretWord}', categoría='${this.secretCategory}', impostor='${impostorName}' (${this.impostorId})`);
    console.log(`[Game ${this.gameId}] Historial de impostores:`, this.impostorHistory.slice(0, 3).map(uid => this.getPlayer(uid)?.name || uid));

    this.phase = 'playing';
    this.persist();
  }

  endGame(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede terminar la partida.');
    this.phase = 'game_over';
    this.persist();
  }

  playAgain(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede empezar una nueva ronda.');

    console.log(`[Game ${this.gameId}] playAgain called. Current phase: ${this.phase}`);

    // Si el juego está en game_over, reiniciar completamente
    if (this.phase === 'game_over') {
      // Resetear todos los puntos y contadores
      this.playerScores = {};
      const activeUids = this.getActivePlayerUids();
      activeUids.forEach(uid => {
        this.playerScores[uid] = 0;
      });
      this.roundCount = 0;
      this.initialPlayerCount = activeUids.length;
      this.maxRounds = 3;
      this.phase = 'lobby';
      console.log(`[Game ${this.gameId}] ✅ Nueva partida iniciada desde game_over. Jugadores: ${this.initialPlayerCount}, Max rondas: ${this.maxRounds}`);
    } else {
      console.log(`[Game ${this.gameId}] Continuando con siguiente ronda. Ronda actual: ${this.roundCount}`);
    }

    this.startNewRound();
    // Persistence handled in startNewRound
  }

  // Métodos de votación
  castVote(voterId, targetId) {
    // Validaciones
    if (this.phase !== 'playing') {
      throw new Error('Solo puedes votar durante una ronda activa.');
    }

    if (this.eliminatedInRound.includes(voterId)) {
      throw new Error('Los jugadores eliminados no pueden votar.');
    }

    if (!this.roundPlayers.includes(voterId)) {
      throw new Error('No estás participando en esta ronda.');
    }

    // Si targetId es null o undefined, el jugador está desmarcando su voto
    if (targetId === null || targetId === undefined) {
      if (this.votes[voterId]) {
        delete this.votes[voterId];
        console.log(`[Game ${this.gameId}] ${voterId} desmarcó su voto`);
      }
      return; // No verificar si todos votaron cuando se desmarca
    }

    if (voterId === targetId) {
      throw new Error('No puedes votarte a ti mismo.');
    }

    if (this.eliminatedInRound.includes(targetId)) {
      throw new Error('No puedes votar a un jugador eliminado.');
    }

    if (!this.roundPlayers.includes(targetId)) {
      throw new Error('Ese jugador no está en esta ronda.');
    }

    // Registrar o cambiar voto
    const isChangingVote = this.votes[voterId] !== undefined;
    this.votes[voterId] = targetId;
    console.log(`[Game ${this.gameId}] ${voterId} ${isChangingVote ? 'cambió su voto a' : 'votó a'} ${targetId}`);

    // Verificar si todos han votado
    this.checkIfAllVoted();
    this.persist();
  }

  checkIfAllVoted() {
    const activePlayers = this.roundPlayers.filter(uid => !this.eliminatedInRound.includes(uid));
    const votedPlayers = Object.keys(this.votes).filter(uid => activePlayers.includes(uid));

    if (votedPlayers.length === activePlayers.length) {
      console.log(`[Game ${this.gameId}] Todos han votado. Procesando resultados...`);
      this.processVotingResults();
    }
  }

  processVotingResults() {
    // Contar votos
    const voteCount = {};
    const activePlayers = this.roundPlayers.filter(uid => !this.eliminatedInRound.includes(uid));

    console.log(`[Game ${this.gameId}] Procesando resultados. Jugadores activos:`, activePlayers);
    console.log(`[Game ${this.gameId}] Votos registrados:`, this.votes);

    Object.entries(this.votes).forEach(([voter, target]) => {
      if (activePlayers.includes(voter)) {
        voteCount[target] = (voteCount[target] || 0) + 1;
      }
    });

    console.log(`[Game ${this.gameId}] Conteo de votos:`, voteCount);

    // Encontrar el más votado
    let maxVotes = 0;
    let mostVoted = [];

    Object.entries(voteCount).forEach(([playerId, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        mostVoted = [playerId];
      } else if (votes === maxVotes) {
        mostVoted.push(playerId);
      }
    });

    console.log(`[Game ${this.gameId}] Más votados:`, mostVoted, `con ${maxVotes} votos`);

    // Guardar historial de esta vuelta
    this.turnHistory.push({
      turn: this.currentTurn,
      votes: { ...this.votes },
      voteCount: { ...voteCount },
      eliminated: mostVoted.length === 1 ? mostVoted[0] : null,
      tie: mostVoted.length > 1 || mostVoted.length === 0
    });

    // Manejar empate o sin votos
    if (mostVoted.length !== 1) {
      const reason = mostVoted.length === 0 ? 'sin votos' : `empate entre: ${mostVoted.join(', ')}`;
      console.log(`[Game ${this.gameId}] No hay eliminación (${reason}).`);

      // Si ya estamos en la vuelta 3, el impostor gana
      if (this.currentTurn >= this.maxTurns) {
        console.log(`[Game ${this.gameId}] Vuelta 3 completada sin eliminación. ¡El impostor gana!`);
        // Dar puntos al impostor por sobrevivir la última vuelta (vuelta 3 = 4 puntos)
        this.playerScores[this.impostorId] = (this.playerScores[this.impostorId] || 0) + 4;
        this.lastRoundScores[this.impostorId] = (this.lastRoundScores[this.impostorId] || 0) + 4;
        this.endRound(false); // Impostor gana
      } else {
        console.log(`[Game ${this.gameId}] Empate: siguiente vuelta sin puntos.`);
        this.lastEliminatedInTurn = null; // No hubo eliminación por empate
        this.startNextTurn(true); // Pasar true para indicar que fue empate (no dar puntos)
      }
      return;
    }

    // Expulsar al más votado
    const eliminatedId = mostVoted[0];
    this.eliminatedInRound.push(eliminatedId);
    this.eliminatedInRound.push(eliminatedId);
    console.log(`[Game ${this.gameId}] ${eliminatedId} ha sido eliminado.`);

    // Verificar si era el impostor
    if (eliminatedId === this.impostorId) {
      console.log(`[Game ${this.gameId}] ¡El impostor fue descubierto!`);
      this.endRound(true); // Amigos ganan
    } else {
      // Era un amigo, continuar o terminar
      if (this.currentTurn >= this.maxTurns) {
        console.log(`[Game ${this.gameId}] Tercera vuelta completada. ¡El impostor gana!`);
        this.endRound(false); // Impostor gana
      } else {
        // Siguiente vuelta
        this.lastEliminatedInTurn = eliminatedId; // Guardar quién fue eliminado
        this.startNextTurn();
      }
    }
  }

  startNextTurn(wasTie = false) {
    console.log(`[Game ${this.gameId}] 🔄 startNextTurn llamado. Vuelta actual: ${this.currentTurn} → ${this.currentTurn + 1}`);
    console.log(`[Game ${this.gameId}] lastEliminatedInTurn antes de cambiar vuelta:`, this.lastEliminatedInTurn);
    console.log(`[Game ${this.gameId}] Fue empate:`, wasTie);

    this.currentTurn++;
    this.votes = {}; // Resetear votos para la nueva vuelta

    // Dar puntos al impostor por sobrevivir la vuelta SOLO si hubo eliminación (no empate)
    // Vuelta 1 completada: +2 puntos
    // Vuelta 2 completada: +3 puntos
    // Vuelta 3 completada: +4 puntos
    if (this.currentTurn > 1 && !wasTie) { // No dar puntos si fue empate
      const previousTurn = this.currentTurn - 1;
      const points = previousTurn + 1; // Vuelta 1 = 2 pts, Vuelta 2 = 3 pts, Vuelta 3 = 4 pts
      this.playerScores[this.impostorId] = (this.playerScores[this.impostorId] || 0) + points;
      this.lastRoundScores[this.impostorId] = (this.lastRoundScores[this.impostorId] || 0) + points;
      console.log(`[Game ${this.gameId}] Impostor sobrevivió vuelta ${previousTurn}: +${points} puntos`);
    } else if (wasTie) {
      console.log(`[Game ${this.gameId}] Empate: no se otorgan puntos al impostor`);
    }

    console.log(`[Game ${this.gameId}] ✅ Vuelta ${this.currentTurn} iniciada. lastEliminatedInTurn:`, this.lastEliminatedInTurn);
    this.persist();
  }

  endRound(friendsWon) {
    // Calcular puntos
    this.calculateRoundScores(friendsWon);

    // Verificar si alguien ganó o se alcanzó el máximo de rondas
    const gameOver = this.checkGameOver();

    if (gameOver) {
      this.phase = 'game_over';
      console.log(`[Game ${this.gameId}] ¡Partida terminada! Ganador: ${gameOver}`);
    } else {
      this.phase = 'round_result';
      console.log(`[Game ${this.gameId}] Ronda ${this.roundCount} terminada.`);
    }
    this.persist();
  }

  calculateRoundScores(friendsWon) {
    this.lastRoundScores = {};

    if (friendsWon) {
      // Amigos ganaron: dar puntos a quienes votaron correctamente
      this.turnHistory.forEach(turn => {
        Object.entries(turn.votes).forEach(([voter, target]) => {
          if (target === this.impostorId && !this.eliminatedInRound.includes(voter)) {
            this.playerScores[voter] = (this.playerScores[voter] || 0) + 1;
            this.lastRoundScores[voter] = (this.lastRoundScores[voter] || 0) + 1;
          }
        });
      });

      // +1 punto adicional por expulsar al impostor
      this.roundPlayers.forEach(uid => {
        if (uid !== this.impostorId && !this.eliminatedInRound.includes(uid)) {
          this.playerScores[uid] = (this.playerScores[uid] || 0) + 1;
          this.lastRoundScores[uid] = (this.lastRoundScores[uid] || 0) + 1;
        }
      });
    } else {
      // Impostor ganó
      // Los puntos por sobrevivir cada vuelta ya fueron dados durante el juego (2, 3, 4 puntos)
      // No hay puntos adicionales

      // Dar puntos a amigos que votaron correctamente (aunque no ganaron)
      this.turnHistory.forEach(turn => {
        Object.entries(turn.votes).forEach(([voter, target]) => {
          if (target === this.impostorId && voter !== this.impostorId) {
            this.playerScores[voter] = (this.playerScores[voter] || 0) + 1;
            this.lastRoundScores[voter] = (this.lastRoundScores[voter] || 0) + 1;
          }
        });
      });
    }

    console.log(`[Game ${this.gameId}] Puntos de esta ronda:`, this.lastRoundScores);
  }

  checkGameOver() {
    // Verificar si alguien alcanzó el puntaje objetivo
    for (const [playerId, score] of Object.entries(this.playerScores)) {
      if (score >= this.targetScore) {
        return playerId;
      }
    }

    // Verificar si se alcanzó el máximo de rondas
    if (this.roundCount >= this.maxRounds) {
      // Encontrar al jugador con más puntos
      let maxScore = 0;
      const playersWithMaxScore = [];

      Object.entries(this.playerScores).forEach(([playerId, score]) => {
        if (score > maxScore) {
          maxScore = score;
          playersWithMaxScore.length = 0; // Limpiar array
          playersWithMaxScore.push(playerId);
        } else if (score === maxScore) {
          playersWithMaxScore.push(playerId);
        }
      });

      // Solo declarar ganador si hay uno claro (no empate)
      if (playersWithMaxScore.length === 1) {
        return playersWithMaxScore[0];
      }

      // Si hay empate, continuar jugando
      console.log(`[Game ${this.gameId}] Empate con ${maxScore} puntos. Continuando...`);
      return null;
    }

    return null;
  }

  getActivePlayers() {
    return this.roundPlayers.filter(uid => !this.eliminatedInRound.includes(uid));
  }

  hasVoted(playerId) {
    return this.votes.hasOwnProperty(playerId);
  }

  getStateFor(userId) {
    const player = this.getPlayer(userId);
    // Allow users with any status to view state (for spectating / history)
    // But only active players can participate
    if (!player) return null;

    // For client compatibility, convert players object to array format
    const playersArray = this.getPlayersAsArray();

    const baseState = {
      gameId: this.gameId,
      hostId: this.hostId,
      players: playersArray,  // Array format for client
      phase: this.phase,
      playerScores: this.playerScores,
      roundCount: this.roundCount,
      maxRounds: this.maxRounds,
      targetScore: this.targetScore,
      playerOrder: this.playerOrder,
      startingPlayerId: this.startingPlayerId,
      myStatus: player.status,  // Tell client their status
    };

    if (this.phase === 'playing') {
      const isInRound = this.roundPlayers.includes(userId);
      if (!isInRound) {
        baseState.phase = 'lobby_wait';
      } else {
        baseState.role = this.impostorId === userId ? 'impostor' : 'amigo';
        const isImpostor = this.impostorId === userId;
        baseState.secretWord = isImpostor ? 'Descubre la palabra secreta' : this.secretWord;
        if (isImpostor && this.showImpostorHint) {
          baseState.secretCategory = this.secretCategory;
        }

        // Info de votación
        baseState.currentTurn = this.currentTurn;
        baseState.maxTurns = this.maxTurns;
        baseState.eliminatedInRound = this.eliminatedInRound;
        baseState.lastEliminatedInTurn = this.lastEliminatedInTurn;
        baseState.hasVoted = this.hasVoted(userId);
        baseState.votedPlayers = Object.keys(this.votes);
        baseState.myVote = this.votes[userId] || null;
        baseState.activePlayers = this.getActivePlayers();
        baseState.canVote = !this.eliminatedInRound.includes(userId);
      }
    } else if (this.phase === 'round_result' || this.phase === 'game_over') {
      const impostor = this.getPlayer(this.impostorId);
      const formerImpostor = this.formerPlayers[this.impostorId];
      baseState.impostorName = impostor ? impostor.name : (formerImpostor ? formerImpostor.name : 'Jugador desconectado');
      baseState.impostorId = this.impostorId;
      baseState.secretWord = this.secretWord;
      baseState.lastRoundScores = this.lastRoundScores;
      baseState.eliminatedInRound = this.eliminatedInRound;
      baseState.formerPlayers = this.formerPlayers;

      if (this.phase === 'game_over') {
        const winnerId = this.checkGameOver();
        const winner = this.getPlayer(winnerId);
        const formerWinner = this.formerPlayers[winnerId];
        baseState.winner = winner ? winner.name : (formerWinner ? formerWinner.name : 'Empate');
        baseState.winnerId = winnerId;
      }
    }

    // Always include formerPlayers for showing scores
    baseState.formerPlayers = this.formerPlayers;

    return baseState;
  }
}

module.exports = Game;
