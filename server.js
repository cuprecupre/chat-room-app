const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const words = require('./words'); 
const Game = require('./Game'); 

// --- Firebase Admin SDK Setup ---
// Admite múltiples rutas/formas de credenciales:
// 1) ./firebase-service-account.json
// 2) ./serviceAccountKey.json
// 3) GOOGLE_APPLICATION_CREDENTIALS con applicationDefault()
(() => {
  let initialized = false;
  const candidates = [
    './firebase-service-account.json',
    './serviceAccountKey.json',
  ];
  for (const p of candidates) {
    try {
      const serviceAccount = require(p);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log(`Firebase Admin inicializado con ${p}.`);
      initialized = true;
      break;
    } catch (_) {
      // continuar con siguiente candidato
    }
  }
  if (!initialized) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      console.log('Firebase Admin inicializado con applicationDefault().');
      initialized = true;
    } catch (e) {
      console.error('No se pudo inicializar Firebase Admin.');
      console.error("Proporciona 'firebase-service-account.json' o 'serviceAccountKey.json' en la raíz, o configura GOOGLE_APPLICATION_CREDENTIALS.");
      process.exit(1);
    }
  }
})();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// --- Middleware for authenticating Firebase tokens ---
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Add user info to the request object
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
};


// --- Server Setup: serve only the React (shadcn) app build ---
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));
// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io/')) return next();
  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res
      .status(500)
      .send('Client build not found. Run "npm run build" inside the client/ folder.');
  }
  res.sendFile(indexPath);
});

// --- In-memory State ---
const games = {}; // { gameId: Game_instance }
const userSockets = {}; // { userId: socket.id }

// --- Socket.IO Middleware ---
io.use(async (socket, next) => {
  const { token, name, photoURL } = socket.handshake.auth;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = {
      uid: decodedToken.uid,
      name: name || decodedToken.name, // Fallback to token's name
      photoURL: photoURL,
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    next(new Error('Authentication error: Invalid token.'));
  }
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.name} (${user.uid})`);
    userSockets[user.uid] = socket.id;

    // Helper to find which game a user belongs to
    const findUserGame = (userId) => Object.values(games).find(g => g.players.some(p => p.uid === userId));

    // Reconnection logic: if user is already in a game, send them the state
    const existingGame = findUserGame(user.uid);
    if (existingGame) {
        socket.join(existingGame.gameId);
        console.log(`User ${user.name} reconnected to game ${existingGame.gameId}`);
        // Send the specific state to the reconnected user only
        socket.emit('game-state', existingGame.getStateFor(user.uid));
    }

    // Helper to broadcast the state to all players in a game
    const emitGameState = (game) => {
        game.players.forEach(p => {
            const playerSocketId = userSockets[p.uid];
            if (playerSocketId) {
                // Send each player their specific version of the state
                io.to(playerSocketId).emit('game-state', game.getStateFor(p.uid));
            }
        });
    };

    socket.on('create-game', () => {
        if (findUserGame(user.uid)) return socket.emit('error-message', 'Ya estás en una partida.');
        const newGame = new Game(user);
        games[newGame.gameId] = newGame;
        socket.join(newGame.gameId);
        emitGameState(newGame);
        console.log(`Game created: ${newGame.gameId} by ${user.name}`);
    });

    socket.on('join-game', (gameId) => {
        const gameToJoin = games[gameId];
        if (!gameToJoin) return socket.emit('error-message', 'La partida no existe.');
        // Allow rejoining the same game, but not a different one
        const userGame = findUserGame(user.uid);
        if (userGame && userGame.gameId !== gameId) {
             return socket.emit('error-message', 'Ya estás en otra partida.');
        }
        
        gameToJoin.addPlayer(user);
        socket.join(gameId);
        emitGameState(gameToJoin);
        console.log(`User ${user.name} joined game ${gameId}`);
    });

    // Generic handler for game actions to reduce boilerplate
    const handleGameAction = (gameId, action) => {
        const game = games[gameId];
        if (!game) return socket.emit('error-message', 'La partida no existe.');
        // Ensure the player is in the game before allowing actions
        if (!game.players.some(p => p.uid === user.uid)) {
            return socket.emit('error-message', 'No perteneces a esta partida.');
        }
        try {
            action(game);
            emitGameState(game);
        } catch (error) {
            console.error(`Action failed for game ${gameId}:`, error.message);
            socket.emit('error-message', error.message);
        }
    };

    socket.on('start-game', (gameId) => handleGameAction(gameId, g => g.startGame(user.uid)));
    socket.on('end-game', (gameId) => handleGameAction(gameId, g => g.endGame(user.uid)));
    socket.on('play-again', (gameId) => handleGameAction(gameId, g => g.playAgain(user.uid)));
    socket.on('leave-game', (gameId) => {
        const game = games[gameId];
        if (!game || !game.players.some(p => p.uid === user.uid)) {
            // Game doesn't exist or user is not in it. Nothing to do.
            // We can send a null state just in case the client is out of sync.
            socket.emit('game-state', null);
            return;
        }

        console.log(`User ${user.name} is leaving game ${gameId}`);
        
        // Remove player from the game model
        game.removePlayer(user.uid);
        
        // 1. Tell the leaving player to go to the lobby by resetting their state
        socket.emit('game-state', null);
        socket.leave(gameId);

        // 2. Notify all *remaining* players of the change
        emitGameState(game);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${user.name}`);
        const userGame = findUserGame(user.uid);
        if (userGame) {
            userGame.removePlayer(user.uid);
            emitGameState(userGame);
        }
        delete userSockets[user.uid];
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
