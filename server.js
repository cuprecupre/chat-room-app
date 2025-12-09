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
// 1) FIREBASE_SERVICE_ACCOUNT (JSON string en env)
// 2) ./firebase-service-account.json
// 3) ./serviceAccountKey.json
// 4) GOOGLE_APPLICATION_CREDENTIALS con applicationDefault()
(() => {
  let initialized = false;
  // Preferred: FIREBASE_SERVICE_ACCOUNT as full JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT && !initialized) {
    try {
      const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(json) });
      console.log('Firebase Admin inicializado con FIREBASE_SERVICE_ACCOUNT.');
      initialized = true;
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT inválido. Intentando alternativas...');
    }
  }
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
      console.error("Proporciona 'FIREBASE_SERVICE_ACCOUNT' como variable de entorno, 'firebase-service-account.json' o 'serviceAccountKey.json' en la raíz, o configura GOOGLE_APPLICATION_CREDENTIALS.");
      process.exit(1);
    }
  }
})();

const app = express();
const server = http.createServer(app);
const dynamicOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

// En desarrollo, permitir conexiones desde la red local para testing móvil
const corsOrigin = process.env.NODE_ENV === 'production'
  ? [...defaultDevOrigins, ...dynamicOrigins]
  : (origin, callback) => {
    // Permitir localhost y IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (!origin ||
      origin.includes('localhost') ||
      /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin) ||
      dynamicOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };

const io = socketIo(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
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

// Sirve og.png con no-cache para forzar refresco en scrapers (WhatsApp)
app.get('/og.png', (req, res) => {
  const ogPath = path.join(clientDist, 'og.png');
  if (!fs.existsSync(ogPath)) return res.status(404).end();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.type('png');
  res.sendFile(ogPath);
});

// Configurar cache para assets estáticos
app.use(express.static(clientDist, {
  maxAge: '1y', // Cache por 1 año para assets estáticos
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache más agresivo para imágenes
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache para CSS y JS
    if (path.match(/\.(css|js)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache para HTML
    if (path.match(/\.html$/)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Servir archivos estáticos de la carpeta public (root)
// Esto asegura que robots.txt y sitemap.xml se sirvan correctamente
app.use(express.static(path.join(__dirname, 'public')));
// SPA fallback con inyección de OG absoluta
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io/')) return next();
  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res
      .status(500)
      .send('Client build not found. Run "npm run build" inside the client/ folder.');
  }
  try {
    const raw = fs.readFileSync(indexPath, 'utf8');
    const host = req.get('x-forwarded-host') || req.get('host');
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const baseUrl = `${proto}://${host}`;
    const absoluteOg = `${baseUrl}/og.png`;
    const absoluteFav = `${baseUrl}/favicon.png`;
    // Reemplazos simples para asegurar URLs absolutas en OG/Twitter y opcionalmente favicon
    let html = raw
      .replace(/(property=\"og:image\"\s+content=)\"[^\"]*\"/g, `$1"${absoluteOg}"`)
      .replace(/(name=\"twitter:image\"\s+content=)\"[^\"]*\"/g, `$1"${absoluteOg}"`)
      .replace(/(rel=\"icon\"[^>]*href=)\"[^\"]*\"/g, `$1"${absoluteFav}"`);
    // Asegurar og:image:secure_url
    if (/property=\"og:image:secure_url\"/.test(html)) {
      html = html.replace(/(property=\"og:image:secure_url\"\s+content=)\"[^\"]*\"/g, `$1"${absoluteOg}"`);
    } else {
      const secureTag = `\n    <meta property=\"og:image:secure_url\" content=\"${absoluteOg}\" />`;
      html = html.replace(/<title>[\s\S]*?<\/title>/, (m) => `${m}${secureTag}`);
    }
    // Asegurar og:url presente
    if (!/property=\"og:url\"/.test(html)) {
      const injectTag = `\n    <meta property="og:url" content="${baseUrl}${req.originalUrl}" />`;
      html = html.replace(/<title>[\s\S]*?<\/title>/, (m) => `${m}${injectTag}`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    // Si falla la inyección, servir archivo estático
    res.sendFile(indexPath);
  }
});

// --- In-memory State ---
const games = {}; // { gameId: Game_instance }
const userSockets = {}; // { userId: socket.id }
// Users pending removal after grace period: { [uid]: { timeout, gameId } }
const pendingDisconnects = {};
// Heartbeat tracking: { [uid]: { lastSeen, timeout } }
const userHeartbeats = {};

// Helper to find which game a user belongs to (global scope)
const findUserGame = (userId) => Object.values(games).find(g => g.players.some(p => p.uid === userId));

// --- Socket.IO Middleware ---
io.use(async (socket, next) => {
  const { token, name, photoURL } = socket.handshake.auth;
  const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  const userAgent = socket.handshake.headers['user-agent'];

  console.log('🔐 [AUTH] Intento de conexión:', {
    socketId: socket.id,
    ip: clientIp,
    userAgent: userAgent ? userAgent.substring(0, 100) : 'N/A',
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    name: name || 'N/A',
    hasPhotoURL: !!photoURL,
  });

  if (!token) {
    console.error('❌ [AUTH] Error: No se proporcionó token', {
      socketId: socket.id,
      ip: clientIp,
    });
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    console.log('🔍 [AUTH] Verificando token con Firebase Admin...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ [AUTH] Token verificado exitosamente:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || name,
      emailVerified: decodedToken.email_verified,
      authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
      issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
      expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
    });

    socket.user = {
      uid: decodedToken.uid,
      name: name || decodedToken.name, // Fallback to token's name
      photoURL: photoURL,
    };
    next();
  } catch (error) {
    console.error('❌ [AUTH] Error al verificar token:', {
      socketId: socket.id,
      ip: clientIp,
      errorCode: error.code,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    next(new Error('Authentication error: Invalid token.'));
  }
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`User connected: ${user.name} (${user.uid})`);

  // Handle multiple sessions: if user already has a socket, disconnect the old one
  if (userSockets[user.uid]) {
    const oldSocketId = userSockets[user.uid];
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      console.log(`Disconnecting old session for user ${user.name}`);
      oldSocket.emit('session-replaced', 'Tu sesión ha sido reemplazada por una nueva pestaña');
      oldSocket.disconnect(true);
    }
  }

  userSockets[user.uid] = socket.id;

  // Initialize heartbeat for this user
  userHeartbeats[user.uid] = {
    lastSeen: Date.now(),
    timeout: null
  };

  // Reconnection logic: if user is already in a game, join room and send state
  const existingGame = findUserGame(user.uid);
  if (existingGame) {
    socket.join(existingGame.gameId);
    console.log(`User ${user.name} reconnected to game ${existingGame.gameId}`);
    // Cancel any pending removal timer
    if (pendingDisconnects[user.uid]) {
      clearTimeout(pendingDisconnects[user.uid].timeout);
      delete pendingDisconnects[user.uid];
    }
    // Send the specific state to the reconnected user only
    socket.emit('game-state', existingGame.getStateFor(user.uid));
  } else {
    // User not in any game, check if they have a pending disconnect
    if (pendingDisconnects[user.uid]) {
      const pendingGame = games[pendingDisconnects[user.uid].gameId];
      if (pendingGame) {
        socket.join(pendingGame.gameId);
        console.log(`User ${user.name} reconnected to pending game ${pendingGame.gameId}`);
        clearTimeout(pendingDisconnects[user.uid].timeout);
        delete pendingDisconnects[user.uid];
        socket.emit('game-state', pendingGame.getStateFor(user.uid));
      }
    }
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

  socket.on('create-game', (options = {}) => {
    // Allow creating new game even if in another - leave current first
    const userGame = findUserGame(user.uid);
    if (userGame) {
      console.log(`User ${user.name} leaving game ${userGame.gameId} to create new game`);
      userGame.removePlayer(user.uid);
      socket.leave(userGame.gameId);
      emitGameState(userGame);
    }

    const newGame = new Game(user, options);
    games[newGame.gameId] = newGame;
    socket.join(newGame.gameId);
    emitGameState(newGame);
    console.log(`Game created: ${newGame.gameId} by ${user.name} with options:`, options);
  });

  socket.on('join-game', (gameId) => {
    const gameToJoin = games[gameId];
    if (!gameToJoin) return socket.emit('error-message', 'La partida no existe.');

    // No permitir unirse si la partida ya empezó (salvo que ya seas parte del juego)
    const isAlreadyInGame = gameToJoin.players.some(p => p.uid === user.uid);
    if (gameToJoin.phase === 'playing' && !isAlreadyInGame) {
      return socket.emit('error-message', 'No puedes unirte a una partida en curso.');
    }

    // Allow switching games - leave current game first if in one
    const userGame = findUserGame(user.uid);
    if (userGame && userGame.gameId !== gameId) {
      console.log(`User ${user.name} switching from game ${userGame.gameId} to ${gameId}`);
      // Remove from current game
      userGame.removePlayer(user.uid);
      socket.leave(userGame.gameId);
      emitGameState(userGame);
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

  // Voting endpoint
  socket.on('cast-vote', ({ gameId, targetId }) => {
    const game = games[gameId];
    if (!game) return socket.emit('error-message', 'La partida no existe.');
    if (!game.players.some(p => p.uid === user.uid)) {
      return socket.emit('error-message', 'No perteneces a esta partida.');
    }
    try {
      game.castVote(user.uid, targetId);
      // Broadcast updated state to all players
      emitGameState(game);
    } catch (error) {
      console.error(`Vote failed for game ${gameId}:`, error.message);
      socket.emit('error-message', error.message);
    }
  });

  socket.on('leave-game', (gameId) => {
    const game = games[gameId];
    if (!game || !game.players.some(p => p.uid === user.uid)) {
      // Game doesn't exist or user is not in it. Nothing to do.
      // We can send a null state just in case the client is out of sync.
      socket.emit('game-state', null);
      return;
    }

    console.log(`User ${user.name} is leaving game ${gameId}`);

    // Clear any pending disconnect timer since user is manually leaving
    if (pendingDisconnects[user.uid]) {
      clearTimeout(pendingDisconnects[user.uid].timeout);
      delete pendingDisconnects[user.uid];
    }

    // Remove player from the game model
    game.removePlayer(user.uid);

    // 1. Tell the leaving player to go to the lobby by resetting their state
    socket.emit('game-state', null);
    socket.leave(gameId);

    // 2. Notify all *remaining* players of the change
    emitGameState(game);
  });

  // Safety: if a client requests their current state explicitly
  socket.on('get-state', () => {
    const userGame = findUserGame(user.uid);
    if (!userGame) {
      return socket.emit('game-state', null);
    }
    socket.emit('game-state', userGame.getStateFor(user.uid));
  });

  // Heartbeat handler to detect if user is still active
  socket.on('heartbeat', () => {
    if (userHeartbeats[user.uid]) {
      userHeartbeats[user.uid].lastSeen = Date.now();
      // Clear any existing timeout
      if (userHeartbeats[user.uid].timeout) {
        clearTimeout(userHeartbeats[user.uid].timeout);
      }
      // Set new timeout for 2 minutes of inactivity
      userHeartbeats[user.uid].timeout = setTimeout(() => {
        console.log(`User ${user.name} appears to be inactive, but keeping in game`);
        // Don't remove from game, just log for monitoring
      }, 120000); // 2 minutes
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.name}`);
    const userGame = findUserGame(user.uid);
    if (userGame) {
      // Check if user was recently active (within last 2 minutes)
      const heartbeat = userHeartbeats[user.uid];
      const timeSinceLastSeen = heartbeat ? Date.now() - heartbeat.lastSeen : Infinity;
      const wasRecentlyActive = timeSinceLastSeen < 120000; // 2 minutes

      if (wasRecentlyActive) {
        // User was recently active, likely just mobile lock - start long grace period
        if (pendingDisconnects[user.uid]) {
          clearTimeout(pendingDisconnects[user.uid].timeout);
        }
        pendingDisconnects[user.uid] = {
          gameId: userGame.gameId,
          timeout: setTimeout(() => {
            const g = games[userGame.gameId];
            if (!g) return;
            console.log(`[Grace Expired] Removing user ${user.name} from game ${userGame.gameId} after 5 minutes`);
            g.removePlayer(user.uid);
            emitGameState(g);
            delete pendingDisconnects[user.uid];
          }, 300000) // 5 minutes grace period for mobile users who lock their phones
        };
        console.log(`[Disconnect] Long grace timer started for user ${user.name} in game ${userGame.gameId} (mobile lock detected)`);
      } else {
        // User was inactive for a while, likely real disconnect - shorter grace period
        if (pendingDisconnects[user.uid]) {
          clearTimeout(pendingDisconnects[user.uid].timeout);
        }
        pendingDisconnects[user.uid] = {
          gameId: userGame.gameId,
          timeout: setTimeout(() => {
            const g = games[userGame.gameId];
            if (!g) return;
            console.log(`[Grace Expired] Removing user ${user.name} from game ${userGame.gameId} after 1 minute`);
            g.removePlayer(user.uid);
            emitGameState(g);
            delete pendingDisconnects[user.uid];
          }, 60000) // 1 minute for users who were already inactive
        };
        console.log(`[Disconnect] Short grace timer started for user ${user.name} in game ${userGame.gameId} (was already inactive)`);
      }
    }
    // Only delete userSockets if this is the current socket (not replaced)
    if (userSockets[user.uid] === socket.id) {
      delete userSockets[user.uid];
    }
    delete userHeartbeats[user.uid];
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
