require("dotenv").config();

const http = require("http");

// Initialize Firebase first (required before other modules that depend on it)
const { initializeFirebase } = require("./config/firebase");
initializeFirebase();

// Import configuration and services
const { createExpressApp } = require("./config/express");
const { createSocketServer } = require("./config/socketio");
const { socketAuthMiddleware } = require("./middleware/auth");
const apiRoutes = require("./routes/api");
const dbService = require("./services/db");
const gameManager = require("./services/gameManager");
const sessionManager = require("./services/sessionManager");
const statsManager = require("./services/statsManager");
const { registerSocketHandlers } = require("./handlers/socketHandlers");

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialize Services ---
dbService.initialize();

// --- Create Express App ---
const app = createExpressApp();

// --- Register API Routes ---
app.use("/api", apiRoutes);

// --- SPA Fallback (must be after API routes) ---
const path = require("path");
const clientBuildPath = path.join(__dirname, "../../client/dist");
app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

// --- Create HTTP Server ---
const server = http.createServer(app);

// --- Create Socket.IO Server ---
const io = createSocketServer(server);

// --- Initialize GameManager with Socket.IO ---
gameManager.initialize(io);

// --- Initialize StatsManager ---
statsManager.initialize(sessionManager, gameManager);

// --- Socket.IO Authentication Middleware ---
io.use(socketAuthMiddleware);

// --- Socket.IO Connection Handler ---
io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
});

// --- Recover Games from Database ---
gameManager.recoverGames();

// --- Sync Stats to Firestore (every 5 minutes) ---
const STATS_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
    statsManager.syncToFirestore();
}, STATS_SYNC_INTERVAL);

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
