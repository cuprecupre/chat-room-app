const socketIo = require("socket.io");

function createSocketServer(httpServer) {
    return socketIo(httpServer, {
        cors: { origin: "*" },
        transports: ["websocket", "polling"], // Prioritize WebSocket, fallback to polling
        pingTimeout: 60000, // 60s timeout (helps mobile connections)
        pingInterval: 25000, // 25s ping interval
        upgradeTimeout: 30000, // Give mobile more time to upgrade
    });
}

module.exports = { createSocketServer };
