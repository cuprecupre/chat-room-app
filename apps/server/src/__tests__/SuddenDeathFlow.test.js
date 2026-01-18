const Room = require('../Room');
const { startNextRound } = require('../game/RoundManager');

describe('Sudden Death Flow Verification', () => {
    let hostUser, player2, player3;
    let room;

    beforeEach(() => {
        hostUser = { uid: 'host1', name: 'Host' };
        player2 = { uid: 'player2', name: 'Player 2' };
        player3 = { uid: 'player3', name: 'Player 3' };

        // Setup room with 3 players
        room = new Room(hostUser, { gameMode: 'voice' });
        room.addPlayer(player2);
        room.addPlayer(player3);
    });

    afterEach(() => {
        if (room) room.destroy && room.destroy();
    });

    test('SCENARIO: Defer Sudden Death (Overlay 1 -> Overlay 2)', () => {
        console.log('\n--- Test: Sudden Death Flow Sequence ---');

        // 1. Start Match
        const match = room.startMatch(hostUser.uid);
        expect(match.phase).toBe('playing');

        // Identify Impostor
        const impostorId = match.impostorId;
        console.log(`Impostor is: ${impostorId}`);

        // 2. Eliminate a Friend (Leaving 2 players: Impostor + 1 Friend)
        // Identify a friend to eliminate
        const friendToEliminate = [hostUser.uid, player2.uid, player3.uid]
            .find(uid => uid !== impostorId);

        console.log(`Eliminating friend: ${friendToEliminate}`);

        // Cast votes to eliminate the friend
        const voters = [hostUser, player2, player3];
        voters.forEach(voter => {
            if (voter.uid === friendToEliminate) {
                // Victim votes for someone else (e.g., the Impostor or Host)
                match.castVote(voter.uid, impostorId);
            } else {
                // Everyone else votes for the victim
                match.castVote(voter.uid, friendToEliminate);
            }
        });

        // 3. Verify Phase is ROUND_RESULT (Overlay 1)
        // CRITICAL: Previously this would have jumped to 'game_over'
        // Now it must stop at 'round_result' to show the "Player Eliminated" overlay
        expect(match.phase).toBe('round_result');
        expect(match.eliminatedPlayers).toContain(friendToEliminate);
        expect(match.winnerId).toBeNull(); // Game NOT over yet, winnerId is null

        console.log('✅ Step 1 Success: Match paused at "round_result" (Overlay 1 shown)');

        // 4. Trigger Next Round (Simulate Host clicking "Next")
        // This is where handleSuddenDeath should trigger
        console.log('Simulating Host clicking Next Round...');
        startNextRound(match);

        // 5. Verify Phase is GAME_OVER (Overlay 2)
        // Now it should detect 2 players left and trigger Sudden Death
        expect(match.phase).toBe('game_over');
        expect(match.winnerId).toBe(impostorId); // Impostor auto-wins in Sudden Death

        console.log('✅ Step 2 Success: Match correctly transitioned to "game_over" (Sudden Death) on next round start');
    });
});
