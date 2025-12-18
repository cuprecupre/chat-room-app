require("dotenv").config();

const http = require("http");

// Initialize Firebase first (required before other modules that depend on it)
const { initializeFirebase } = require("./config/firebase");
initializeFirebase();

// Import configuration and services
const { createExpressApp, setupSpaFallback } = require("./config/express");
const { createSocketServer } = require("./config/socketio");
const { socketAuthMiddleware } = require("./middleware/auth");
const apiRoutes = require("./routes/api");
const dbService = require("./services/db");
const gameManager = require("./services/gameManager");
const { registerSocketHandlers } = require("./handlers/socketHandlers");

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const ENABLE_DB_PERSISTENCE =
    String(process.env.ENABLE_DB_PERSISTENCE || "")
        .trim()
        .toLowerCase() === "true";
const DB_COLLECTION_NAME = "games";

// --- Initialize Services ---
dbService.initialize({
    enabled: ENABLE_DB_PERSISTENCE,
    collectionName: DB_COLLECTION_NAME,
});

// --- Create Express App ---
const app = createExpressApp();

// --- Register API Routes ---
app.use("/api", apiRoutes);

// --- Setup SPA Fallback (must be after API routes) ---
setupSpaFallback(app);

// --- Create HTTP Server ---
const server = http.createServer(app);

// --- Create Socket.IO Server ---
const io = createSocketServer(server);

// --- Initialize GameManager with Socket.IO ---
gameManager.initialize(io);

// --- Socket.IO Authentication Middleware ---
io.use(socketAuthMiddleware);

// --- Socket.IO Connection Handler ---
io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
});

// --- Recover Games from Database ---
if (ENABLE_DB_PERSISTENCE) {
    gameManager.recoverGames();
}

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
