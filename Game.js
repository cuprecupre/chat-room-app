const { getRandomWordWithCategory } = require('./words');
const dbService = require('./server/services/db');

class Game {
  constructor(hostUser, options = {}) {
    this.gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.hostId = hostUser.uid;
    this.players = [];
    this.phase = 'lobby'; // lobby, playing, round_result, game_over
    this.secretWord = '';
    this.secretCategory = '';
    this.impostorId = '';
    this.roundPlayers = []; // uids activos en la ronda actual

    // Opciones del juego
    this.showImpostorHint = options.showImpostorHint !== undefined ? options.showImpostorHint : true; // Por defecto mostrar pista

    // Sistema de vueltas
    this.currentTurn = 1; // Vuelta actual (1, 2, 3)
    this.maxTurns = 3;
    this.eliminatedInRound = []; // Jugadores expulsados en esta ronda (acumulado de todas las vueltas)
    this.lastEliminatedInTurn = null; // Último jugador eliminado en la vuelta anterior

    // Sistema de votación
    this.votes = {}; // { [playerId]: votedForPlayerId }
    this.turnHistory = []; // Historial de vueltas y resultados

    // Sistema de puntos
    this.playerScores = {}; // { [playerId]: totalScore }
    this.roundCount = 0; // Contador de rondas jugadas
    this.initialPlayerCount = 0; // Guardado para referencia
    this.maxRounds = 0; // Máximo de rondas (3 partidas fijas)
    this.targetScore = 15; // Puntos para ganar
    this.lastRoundScores = {}; // Puntos ganados en la última ronda

    // Sistema de orden y jugador inicial
    this.playerOrder = []; // Orden base (OB): uids ordenados por joinedAt
    this.startingPlayerId = null; // Jugador que inicia la ronda actual

    // Historial de impostores para evitar repeticiones
    this.impostorHistory = []; // Array de uids de los últimos impostores [más reciente, ... , más antiguo]

    // If restoring, do NOT add dummy player or persist initial state
    if (!options.isRestoring) {
      this.addPlayer(hostUser);
      this.persist();
    }
  }

  /**
   * Reconstructs a Game instance from a plain object (database state).
   * @param {string} gameId
   * @param {Object} data 
   */
  static fromState(gameId, data) {
    // Create a dummy host user to satisfy constructor, then overwrite everything
    // DISABLE_PERSISTENCE flag prevents the constructor from saving the "Recovering..." state
    const dummyHost = { uid: data.hostId, name: 'Recovering...' };
    const game = new Game(dummyHost, {
      showImpostorHint: data.showImpostorHint,
      isRestoring: true // Prevent side-effects in constructor
    });

    // Overwrite fields
    game.gameId = gameId; // Ensure ID matches DB
    game.hostId = data.hostId;
    game.phase = data.phase;
    // Sanitize players to avoid undefined photoURL issues
    game.players = (data.players || []).map(p => ({
      ...p,
      photoURL: p.photoURL || null
    }));
    game.playerScores = data.playerScores || {};

    // Config
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

    // Arrays & Collections
    game.roundPlayers = data.roundPlayers || [];
    game.eliminatedInRound = data.eliminatedInRound || [];
    game.votes = data.votes || {};
    game.turnHistory = data.turnHistory || [];
    game.lastRoundScores = data.lastRoundScores || {};
    game.playerOrder = data.playerOrder || [];
    game.impostorHistory = data.impostorHistory || [];

    console.log(`[Game Recovery] Game ${gameId} restored in phase '${game.phase}' with ${game.players.length} players.`);
    return game;
  }

  // --- Persistence Helpers ---
  getPersistenceState() {
    return {
      hostId: this.hostId,
      phase: this.phase,
      players: this.players,
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
      impostorHistory: this.impostorHistory
    };
  }

  persist() {
    // Fire and forget - don't block game loop
    dbService.saveGameState(this.gameId, this.getPersistenceState());
  }

  addPlayer(user) {
    if (!this.players.some(p => p.uid === user.uid)) {
      const joinedAt = Date.now();
      this.players.push({
        uid: user.uid,
        name: user.name,
        photoURL: user.photoURL || null, // Evitar undefined para Firestore
        joinedAt: joinedAt
      });
      // Inicializar puntuación del jugador
      this.playerScores[user.uid] = 0;
      // Actualizar orden base (OB)
      this.updatePlayerOrder();
      this.persist();
    }
    // Si la partida está en juego, NO añadir a roundPlayers: esperará a la siguiente ronda
  }

  /**
   * Actualiza el orden base (OB) ordenando jugadores por joinedAt (ASC)
   * El orden base es inmutable salvo altas/bajas de jugadores
   */
  updatePlayerOrder() {
    // Ordenar jugadores por joinedAt (primeros en llegar → arriba)
    const sortedPlayers = [...this.players].sort((a, b) => {
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

    const startingPlayer = this.players.find(p => p.uid === startingPlayerId);
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
      console.log(`[Game ${this.gameId}] Jugador ${this.players.find(p => p.uid === excludedPlayer)?.name} fue impostor las últimas 2 veces, será excluido`);
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

  removePlayer(userId) {
    const playerIsImpostor = this.impostorId === userId;

    this.players = this.players.filter(p => p.uid !== userId);
    this.roundPlayers = this.roundPlayers.filter(uid => uid !== userId);
    this.eliminatedInRound = this.eliminatedInRound.filter(uid => uid !== userId);
    this.eliminatedInRound = this.eliminatedInRound.filter(uid => uid !== userId);
    delete this.votes[userId];
    // NO eliminar playerScores - mantener puntos aunque el jugador abandone
    // delete this.playerScores[userId];

    // Actualizar orden base cuando un jugador se va
    this.updatePlayerOrder();

    if (this.hostId === userId && this.players.length > 0) {
      this.hostId = this.players[0].uid;
    }

    // If the impostor leaves during the game, end the round
    if (this.phase === 'playing' && playerIsImpostor) {
      this.phase = 'round_result';
    } else if (this.phase === 'playing') {
      // If a regular player leaves, check if we can proceed with voting
      this.checkIfAllVoted();
    }
    this.persist();
  }

  startGame(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede iniciar la partida.');
    if (this.players.length < 2) throw new Error('Se necesitan al menos 2 jugadores para empezar.');

    // Establecer máximo de rondas en el primer inicio
    if (this.initialPlayerCount === 0) {
      this.initialPlayerCount = this.players.length;
      this.maxRounds = 3; // Máximo 3 partidas por juego
    }

    this.startNewRound();
  }

  startNewRound() {
    // Reiniciar estado de ronda - todos vuelven a jugar
    this.roundPlayers = this.players.map(p => p.uid);
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

    const impostorName = this.players.find(p => p.uid === this.impostorId)?.name || 'desconocido';
    console.log(`[Game ${this.gameId}] Ronda ${this.roundCount}: palabra='${this.secretWord}', categoría='${this.secretCategory}', impostor='${impostorName}' (${this.impostorId})`);
    console.log(`[Game ${this.gameId}] Historial de impostores:`, this.impostorHistory.slice(0, 3).map(uid => this.players.find(p => p.uid === uid)?.name || uid));

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
      this.players.forEach(p => {
        this.playerScores[p.uid] = 0;
      });
      this.roundCount = 0;
      this.initialPlayerCount = this.players.length;
      this.maxRounds = 3; // Máximo 3 partidas por juego
      this.phase = 'lobby'; // Cambiar fase para evitar checks de game_over
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
    const player = this.players.find(p => p.uid === userId);
    if (!player) return null;

    const baseState = {
      gameId: this.gameId,
      hostId: this.hostId,
      players: this.players,
      phase: this.phase,
      playerScores: this.playerScores,
      roundCount: this.roundCount,
      maxRounds: this.maxRounds,
      targetScore: this.targetScore,
      playerOrder: this.playerOrder,
      startingPlayerId: this.startingPlayerId,
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
        baseState.eliminatedInRound = this.eliminatedInRound;
        baseState.lastEliminatedInTurn = this.lastEliminatedInTurn;
        baseState.hasVoted = this.hasVoted(userId);
        baseState.votedPlayers = Object.keys(this.votes);
        baseState.myVote = this.votes[userId] || null; // A quién votó este usuario
        baseState.activePlayers = this.getActivePlayers();
        baseState.canVote = !this.eliminatedInRound.includes(userId);
      }
    } else if (this.phase === 'round_result' || this.phase === 'game_over') {
      const impostor = this.players.find(p => p.uid === this.impostorId);
      baseState.impostorName = impostor ? impostor.name : 'Jugador desconectado';
      baseState.impostorId = this.impostorId;
      baseState.secretWord = this.secretWord;
      baseState.lastRoundScores = this.lastRoundScores;
      baseState.eliminatedInRound = this.eliminatedInRound;

      if (this.phase === 'game_over') {
        const winnerId = this.checkGameOver();
        const winner = this.players.find(p => p.uid === winnerId);
        baseState.winner = winner ? winner.name : 'Empate';
        baseState.winnerId = winnerId;
      }
    }

    return baseState;
  }
}

module.exports = Game;
