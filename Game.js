const words = require('./words');

class Game {
  constructor(hostUser) {
    this.gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.hostId = hostUser.uid;
    this.players = [];
    this.phase = 'lobby'; // lobby, game, over, lobby_wait (per-user)
    this.secretWord = '';
    this.impostorId = '';
    this.roundPlayers = []; // uids activos en la ronda actual

    this.addPlayer(hostUser);
  }

  addPlayer(user) {
    if (!this.players.some(p => p.uid === user.uid)) {
      this.players.push({ uid: user.uid, name: user.name, photoURL: user.photoURL });
    }
    // Si la partida está en juego, NO añadir a roundPlayers: esperará a la siguiente ronda
  }

  removePlayer(userId) {
    const playerIsImpostor = this.impostorId === userId;

    this.players = this.players.filter(p => p.uid !== userId);
    this.roundPlayers = this.roundPlayers.filter(uid => uid !== userId);

    if (this.hostId === userId && this.players.length > 0) {
      this.hostId = this.players[0].uid;
    }

    // If the impostor leaves during the game, the game is over.
    if (this.phase === 'game' && playerIsImpostor) {
      this.phase = 'over';
    }
  }

  startGame(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede iniciar la partida.');
    if (this.players.length < 2) throw new Error('Se necesitan al menos 2 jugadores para empezar.');

    // Fijar quienes juegan esta ronda
    this.roundPlayers = this.players.map(p => p.uid);
    const impostorIndex = Math.floor(Math.random() * this.roundPlayers.length);
    this.impostorId = this.roundPlayers[impostorIndex];

    this.secretWord = words[Math.floor(Math.random() * words.length)];

    this.phase = 'playing';

  }

  endGame(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede terminar la partida.');
    this.phase = 'over';
  }

  playAgain(userId) {
    if (userId !== this.hostId) throw new Error('Solo el host puede empezar una nueva ronda.');
    this.secretWord = '';
    this.impostorId = '';
    this.phase = 'lobby';
    this.roundPlayers = [];
  }

  getStateFor(userId) {
    const player = this.players.find(p => p.uid === userId);
    if (!player) return null;

    const baseState = {
      gameId: this.gameId,
      hostId: this.hostId,
      players: this.players,
      phase: this.phase,
    };

    if (this.phase === 'playing') {
      const isInRound = this.roundPlayers.includes(userId);
      if (!isInRound) {
        baseState.phase = 'lobby_wait';
      } else {
        baseState.role = this.impostorId === userId ? 'impostor' : 'amigo';
        baseState.secretWord = this.impostorId === userId ? 'Descubre la palabra secreta' : this.secretWord;
      }
    } else if (this.phase === 'over') {
      const impostor = this.players.find(p => p.uid === this.impostorId);
      baseState.impostorName = impostor ? impostor.name : 'N/A';
      baseState.secretWord = this.secretWord;
    }

    return baseState;
  }
}

module.exports = Game;
