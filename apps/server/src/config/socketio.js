const socketIo = require("socket.io");

function createSocketServer(httpServer) {
    return socketIo(httpServer, {
        cors: { origin: "*" },
        perMessageDeflate: {
            threshold: 1024, // Compress only if message > 1KB
        }
    });
}

module.exports = { createSocketServer };
