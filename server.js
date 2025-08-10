const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const crypto = require('crypto');

const games = {}; // Object to store game states

const updatePlayers = (gameId) => {
    if (games[gameId]) {
        io.to(gameId).emit('updatePlayerList', games[gameId].players);
    }
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createGame', ({ name }) => {
        const gameId = crypto.randomBytes(4).toString('hex');
        games[gameId] = {
            players: [{ id: socket.id, name }]
        };
        socket.join(gameId);
        socket.emit('gameCreated', gameId);
        console.log(`Game created with ID: ${gameId} by ${name} (${socket.id})`);
        updatePlayers(gameId);
    });

    socket.on('joinGame', ({ gameId, name }) => {
        if (games[gameId]) {
            games[gameId].players.push({ id: socket.id, name });
            socket.join(gameId);
            socket.emit('joinSuccess');
            console.log(`Player ${name} (${socket.id}) joined game ${gameId}`);
            updatePlayers(gameId);
        } else {
            socket.emit('joinError', 'Game not found.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const gameId in games) {
            const game = games[gameId];
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex > -1) {
                const playerName = game.players[playerIndex].name;
                game.players.splice(playerIndex, 1);
                console.log(`Player ${playerName} (${socket.id}) left game ${gameId}`);
                if (game.players.length === 0) {
                    delete games[gameId];
                    console.log(`Game ${gameId} deleted.`);
                } else {
                    updatePlayers(gameId);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
