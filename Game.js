const { getRandomWordWithCategory } = require('./words');

class Game {
  constructor(hostUser) {
    this.gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.hostId = hostUser.uid;
    this.players = [];
    this.phase = 'lobby'; // lobby, playing, round_result, game_over
    this.secretWord = '';
    this.secretCategory = '';
    this.impostorId = '';
    this.roundPlayers = []; // uids activos en la ronda actual
    
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

    this.addPlayer(hostUser);
  }

  addPlayer(user) {
    if (!this.players.some(p => p.uid === user.uid)) {
      this.players.push({ uid: user.uid, name: user.name, photoURL: user.photoURL });
      // Inicializar puntuación del jugador
      this.playerScores[user.uid] = 0;
    }
    // Si la partida está en juego, NO añadir a roundPlayers: esperará a la siguiente ronda
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

    if (this.hostId === userId && this.players.length > 0) {
      this.hostId = this.players[0].uid;
    }

    // If the impostor leaves during the game, end the round
    if (this.phase === 'playing' && playerIsImpostor) {
      this.phase = 'round_result';
    }
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

    // Seleccionar impostor con mejor aleatoriedad
    // Mezclar el array usando Fisher-Yates shuffle antes de seleccionar
    const shuffledPlayers = [...this.roundPlayers];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    this.impostorId = shuffledPlayers[0];

    // Seleccionar palabra
    const { word, category } = getRandomWordWithCategory();
    this.secretWord = word;
    this.secretCategory = category;
    console.log(`[Game ${this.gameId}] Ronda ${this.roundCount}: palabra='${this.secretWord}', categoría='${this.secretCategory}', impostor='${this.impostorId}'`);

    this.phase = 'playing';
  }

  endGame(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede terminar la partida.');
    this.phase = 'game_over';
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
        // Dar puntos al impostor por sobrevivir la última vuelta
        this.playerScores[this.impostorId] = (this.playerScores[this.impostorId] || 0) + 2;
        this.lastRoundScores[this.impostorId] = (this.lastRoundScores[this.impostorId] || 0) + 2;
        this.endRound(false); // Impostor gana
      } else {
        console.log(`[Game ${this.gameId}] Siguiente vuelta.`);
        this.lastEliminatedInTurn = null; // No hubo eliminación por empate
        this.startNextTurn();
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

  startNextTurn() {
    console.log(`[Game ${this.gameId}] 🔄 startNextTurn llamado. Vuelta actual: ${this.currentTurn} → ${this.currentTurn + 1}`);
    console.log(`[Game ${this.gameId}] lastEliminatedInTurn antes de cambiar vuelta:`, this.lastEliminatedInTurn);
    
    this.currentTurn++;
    this.votes = {}; // Resetear votos para la nueva vuelta
    
    // Dar puntos al impostor por sobrevivir la vuelta
    if (this.currentTurn > 1) { // No en la primera transición
      this.playerScores[this.impostorId] = (this.playerScores[this.impostorId] || 0) + 2;
      this.lastRoundScores[this.impostorId] = (this.lastRoundScores[this.impostorId] || 0) + 2;
      console.log(`[Game ${this.gameId}] Impostor sobrevivió vuelta ${this.currentTurn - 1}: +2 puntos`);
    }
    
    console.log(`[Game ${this.gameId}] ✅ Vuelta ${this.currentTurn} iniciada. lastEliminatedInTurn:`, this.lastEliminatedInTurn);
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
      // +2 puntos por cada vuelta sobrevivida (ya dados durante el juego)
      // +4 puntos extra por ganar la ronda
      this.playerScores[this.impostorId] = (this.playerScores[this.impostorId] || 0) + 4;
      this.lastRoundScores[this.impostorId] = (this.lastRoundScores[this.impostorId] || 0) + 4;
      
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
    };

    if (this.phase === 'playing') {
      const isInRound = this.roundPlayers.includes(userId);
      if (!isInRound) {
        baseState.phase = 'lobby_wait';
      } else {
        baseState.role = this.impostorId === userId ? 'impostor' : 'amigo';
        const isImpostor = this.impostorId === userId;
        baseState.secretWord = isImpostor ? 'Descubre la palabra secreta' : this.secretWord;
        if (isImpostor) {
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
