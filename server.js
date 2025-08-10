const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const crypto = require('crypto');
const words = require('./words');

let games = {}; // { gameId: { hostId: string, players: [{id, name}], word: string, impostorId: string } }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('create-game', ({ playerName }) => {
        const gameId = crypto.randomBytes(4).toString('hex');
        games[gameId] = {
            hostId: socket.id,
            players: [{ id: socket.id, name: playerName }]
        };
        socket.join(gameId);
        socket.emit('game-created', { gameId, hostId: socket.id });
        io.to(gameId).emit('playerList', games[gameId].players.map(p => p.name));
        console.log(`Game created: ${gameId} by ${playerName} (${socket.id})`);
    });

    socket.on('join-game', ({ gameId, playerName }) => {
        const game = games[gameId];
        if (game) {
            game.players.push({ id: socket.id, name: playerName });
            socket.join(gameId);
            socket.emit('lobby-joined', { 
                players: game.players.map(p => p.name),
                hostId: game.hostId
            });
            socket.to(gameId).emit('playerList', game.players.map(p => p.name));
            console.log(`Player ${playerName} (${socket.id}) joined ${gameId}`);
        } else {
            socket.emit('error-message', 'La partida no existe.');
        }
    });

    socket.on('start-game', (gameId) => {
        const game = games[gameId];
        if (!game || socket.id !== game.hostId) {
            return; // Only host can start
        }
        if (game.players.length < 2) {
            // Optional: prevent starting with less than 2 players
            io.to(socket.id).emit('error-message', 'Necesitas al menos 2 jugadores para empezar.');
            return;
        }

        const word = words[Math.floor(Math.random() * words.length)];
        game.word = word;

        const impostorIndex = Math.floor(Math.random() * game.players.length);
        const impostor = game.players[impostorIndex];
        game.impostorId = impostor.id;

        game.players.forEach(player => {
            const role = player.id === game.impostorId ? 'Impostor' : 'Amigo';
            const secretWord = role === 'Impostor' ? '???' : game.word;
            io.to(player.id).emit('game-started', { role, word: secretWord });
        });
        console.log(`Game ${gameId} started. Word: ${word}, Impostor: ${impostor.name}`);
    });

    socket.on('end-game', (gameId) => {
        const game = games[gameId];
        if (!game || socket.id !== game.hostId) {
            return; // Only host can end the game
        }

        const impostor = game.players.find(p => p.id === game.impostorId);
        const result = {
            impostorName: impostor ? impostor.name : 'N/A',
            secretWord: game.word || 'N/A'
        };

        io.to(gameId).emit('game-over', result);
        console.log(`Game ${gameId} ended. Impostor was ${result.impostorName}`);
    });

    socket.on('play-again', (gameId) => {
        const game = games[gameId];
        if (!game || socket.id !== game.hostId) {
            return; // Only host can restart
        }

        // Reset game state for a new round
        game.word = null;
        game.impostorId = null;

        // Reuse the start-game logic
        const word = words[Math.floor(Math.random() * words.length)];
        game.word = word;

        const impostorIndex = Math.floor(Math.random() * game.players.length);
        const impostor = game.players[impostorIndex];
        game.impostorId = impostor.id;

        game.players.forEach(player => {
            const role = player.id === game.impostorId ? 'Impostor' : 'Amigo';
            const secretWord = role === 'Impostor' ? '???' : game.word;
            io.to(player.id).emit('game-started', { role, word: secretWord });
        });
        console.log(`New round for game ${gameId} started. Word: ${word}, Impostor: ${impostor.name}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        let gameIdToDelete = null;

        for (const gameId in games) {
            const game = games[gameId];
            const playerIndex = game.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                game.players.splice(playerIndex, 1);

                if (game.players.length === 0) {
                    gameIdToDelete = gameId;
                } else {
                    // If the host disconnected, assign a new host
                    if (socket.id === game.hostId) {
                        game.hostId = game.players[0].id;
                        console.log(`Host disconnected. New host is ${game.players[0].name}`);
                    }
                    io.to(gameId).emit('playerList', game.players.map(p => p.name));
                }
                break; 
            }
        }

        if (gameIdToDelete) {
            delete games[gameIdToDelete];
            console.log(`Game ${gameIdToDelete} deleted.`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
