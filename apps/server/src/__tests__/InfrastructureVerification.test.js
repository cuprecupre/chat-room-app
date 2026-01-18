const Room = require('../Room');

describe('Infrastructure & Robustness Verification', () => {
    let hostUser, player2, player3;
    let room;

    beforeEach(() => {
        hostUser = { uid: 'host1', name: 'Host' };
        player2 = { uid: 'player2', name: 'Player 2' };
        player3 = { uid: 'player3', name: 'Player 3' };
        room = new Room(hostUser, { gameMode: 'voice' });
        room.addPlayer(player2);
        room.addPlayer(player3);
    });

    afterEach(() => {
        if (room) room.destroy && room.destroy();
    });

    test('SCENARIO 1: Voice Mode Start (Fix for "isLateJoiner" bug)', () => {
        console.log('\n--- Test 1: Voice Mode Validation ---');

        // Simular estado sucio: Jugadores marcados como late joiners por error
        room.players.forEach(p => p.isLateJoiner = true);

        // Verificar que startMatch limpia los flags y permite jugar con 3
        try {
            const match = room.startMatch(hostUser.uid);
            expect(match).toBeDefined();
            expect(room.players.every(p => !p.isLateJoiner)).toBe(true);
            console.log('✅ Voice Mode Start: Success (Flags reset correctly)');
        } catch (e) {
            console.error('❌ Voice Mode Start Failed:', e.message);
            throw e;
        }
    });

    test('SCENARIO 2: Phantom Match Prevention (Fix for Host Abandon logic)', () => {
        console.log('\n--- Test 2: Phantom Match Prevention ---');

        // 1. Iniciar partida normal
        room.startMatch(hostUser.uid);
        expect(room.phase).toBe('playing');

        // 2. Host abandona (simulado)
        // Esto pone la fase en 'host_cancelled'
        const result = room.leaveMatch(hostUser.uid);
        expect(result.hostCancelled).toBe(true);
        expect(room.phase).toBe('host_cancelled');

        // 3. Intentar iniciar partida inmediatamente (Race Condition simulation)
        // El fix debe bloquear esto
        expect(() => {
            room.startMatch(hostUser.uid);
        }).toThrow("La sala se está reiniciando tras el abandono del host.");

        console.log('✅ Phantom Match Prevention: Success (Blocked startMatch during cancellation)');
    });

    test('SCENARIO 3: Voting Resilience (Tie Handling)', () => {
        console.log('\n--- Test 3: Voting Resilience ---');

        const match = room.startMatch(hostUser.uid);
        match.phase = 'playing'; // Forzar fase

        // Simular empate: Host vota P2, P2 vota Host, P3 vota Host
        // Ah no, eso no es empate. 
        // Empate: Host->P2, P2->P3, P3->Host (1 voto cada uno)
        match.castVote('host1', 'player2');
        match.castVote('player2', 'player3');
        match.castVote('player3', 'host1');

        // Verificar logs o estado interno (no crashea)
        // match.castVote internalmente llama a processVotingResults si todos votaron

        // Check output state
        // Si hay empate, phase cambia a 'round_result' (o game_over si ronda 3)
        expect(match.phase).toBe('round_result');

        // Verificar historial
        const lastHistory = match.roundHistory[match.roundHistory.length - 1];
        expect(lastHistory.tie).toBe(true);

        console.log('✅ Voting Resilience: Success (Tie handled gracefully)');
    });
});
