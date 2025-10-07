const Game = require('./Game');

// Mock user objects for testing
const hostUser = { uid: 'host123', name: 'Host Player' };
const player2 = { uid: 'player456', name: 'Player Two' };
const player3 = { uid: 'player789', name: 'Player Three' };

describe('Game Logic', () => {
    let game;

    beforeEach(() => {
        // Create a new game instance before each test
        game = new Game(hostUser);
    });

    test('should create a new game with a host', () => {
        expect(game.hostId).toBe(hostUser.uid);
        expect(game.players).toHaveLength(1);
        expect(game.players[0].uid).toBe(hostUser.uid);
        expect(game.phase).toBe('lobby');
    });

    test('should add a new player to the game', () => {
        game.addPlayer(player2);
        expect(game.players).toHaveLength(2);
        expect(game.players.some(p => p.uid === player2.uid)).toBe(true);
    });

    test('should not add a duplicate player', () => {
        game.addPlayer(hostUser);
        expect(game.players).toHaveLength(1);
    });

    test('should throw an error if a non-host tries to start the game', () => {
        game.addPlayer(player2);
        expect(() => game.startGame(player2.uid)).toThrow('Solo el host puede iniciar la partida.');
    });

    test('should throw an error if trying to start with less than 2 players', () => {
        expect(() => game.startGame(hostUser.uid)).toThrow('Se necesitan al menos 2 jugadores para empezar.');
    });

    describe('when game starts correctly', () => {
        beforeEach(() => {
            game.addPlayer(player2);
            game.addPlayer(player3);
            game.startGame(hostUser.uid);
        });

        test('should change phase to "game"', () => {
            expect(game.phase).toBe('game');
        });

        test('should assign one impostor', () => {
            expect(game.impostorId).not.toBe('');
            const impostorExists = game.players.some(p => p.uid === game.impostorId);
            expect(impostorExists).toBe(true);
        });

        test('should select a secret word', () => {
            expect(game.secretWord).not.toBe('');
        });

        test('should return correct state for impostor', () => {
            const impostorState = game.getStateFor(game.impostorId);
            expect(impostorState.role).toBe('Impostor');
            expect(impostorState.word).toBe('Descubre la palabra secreta');
        });

        test('should return correct state for friends', () => {
            const friend = game.players.find(p => p.uid !== game.impostorId);
            const friendState = game.getStateFor(friend.uid);
            expect(friendState.role).toBe('Amigo');
            expect(friendState.word).toBe(game.secretWord);
        });
    });

    test('should end the game and reveal impostor and word', () => {
        game.addPlayer(player2);
        game.startGame(hostUser.uid);
        game.endGame(hostUser.uid);

        expect(game.phase).toBe('over');
        const finalState = game.getStateFor(hostUser.uid);
        expect(finalState.impostorName).toBeDefined();
        expect(finalState.secretWord).toBe(game.secretWord);
    });

    test('should reset the game for a new round (play again)', () => {
        game.addPlayer(player2);
        game.startGame(hostUser.uid);
        game.endGame(hostUser.uid);
        game.playAgain(hostUser.uid);

        expect(game.phase).toBe('lobby');
        expect(game.impostorId).toBe('');
        expect(game.secretWord).toBe('');
        expect(game.players).toHaveLength(2); // Players should remain for the next round
    });

    test('should not allow the same player to be impostor more than 2 times in a row', () => {
        // Agregar jugadores para tener 3 en total
        game.addPlayer(player2);
        game.addPlayer(player3);
        
        // Simular múltiples rondas y verificar que nadie es impostor 3 veces seguidas
        const impostorCounts = {};
        const impostorSequence = [];
        
        // Simular 20 rondas para tener datos suficientes
        for (let i = 0; i < 20; i++) {
            game.startGame(hostUser.uid);
            const currentImpostor = game.impostorId;
            
            // Registrar el impostor actual
            impostorSequence.push(currentImpostor);
            if (!impostorCounts[currentImpostor]) {
                impostorCounts[currentImpostor] = 0;
            }
            impostorCounts[currentImpostor]++;
            
            // Verificar que no hay 3 impostores consecutivos iguales
            if (impostorSequence.length >= 3) {
                const lastThree = impostorSequence.slice(-3);
                const allSame = lastThree.every(id => id === lastThree[0]);
                expect(allSame).toBe(false);
            }
            
            // Resetear para la siguiente ronda
            game.phase = 'lobby';
            game.roundCount = 0;
        }
        
        // Verificar que el historial se está guardando
        expect(game.impostorHistory.length).toBeGreaterThan(0);
    });

    test('selectImpostorWithLimit should exclude player who was impostor last 2 times', () => {
        game.addPlayer(player2);
        game.addPlayer(player3);
        
        // Simular que player2 fue impostor las últimas 2 veces
        game.impostorHistory = [player2.uid, player2.uid];
        game.roundPlayers = [hostUser.uid, player2.uid, player3.uid];
        
        // Llamar selectImpostorWithLimit múltiples veces para verificar
        // que player2 nunca es seleccionado
        const selections = new Set();
        for (let i = 0; i < 30; i++) {
            const selected = game.selectImpostorWithLimit();
            selections.add(selected);
            expect(selected).not.toBe(player2.uid);
        }
        
        // Verificar que al menos uno de los otros jugadores fue seleccionado
        expect(selections.size).toBeGreaterThan(0);
        expect(selections.has(hostUser.uid) || selections.has(player3.uid)).toBe(true);
    });
});
