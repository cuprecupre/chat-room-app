const socketIo = require("socket.io");

function createSocketServer(httpServer) {
    return socketIo(httpServer, {
        cors: { origin: "*" },
    });
}

module.exports = { createSocketServer };
