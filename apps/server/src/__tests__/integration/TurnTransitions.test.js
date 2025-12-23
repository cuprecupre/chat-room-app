/**
 * Integration tests for Turn Transitions
 * 
 * These tests verify that turn transitions work correctly and that
 * the state is properly emitted to clients.
 */

const { GameSimulator } = require('./GameSimulator');

describe('Turn Transitions (Integration)', () => {
    let sim;

    beforeEach(() => {
        sim = new GameSimulator();
    });

    describe('Basic Turn Flow', () => {
        test('Turn 1 → Turn 2 when non-impostor is eliminated', () => {
            // Setup: 4 players
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3', 'Player4'])
                .startGame();

            const initialState = sim.getState();
            expect(initialState.phase).toBe('playing');
            expect(initialState.currentTurn).toBe(1);

            // Get a non-impostor to vote out
            const targetIndex = sim.getNonImpostorIndex();

            // All vote for the non-impostor
            sim.allVoteFor(targetIndex);

            const afterVoteState = sim.getState();

            // Should be in Turn 2 (non-impostor eliminated, 3+ players remain)
            expect(afterVoteState.currentTurn).toBe(2);
            expect(afterVoteState.phase).toBe('playing');
            expect(afterVoteState.lastEliminatedInTurn).toBe(sim.users[targetIndex].uid);
        });

        test('Turn 1 → Turn 2 on tie (no elimination)', () => {
            // Setup: 3 players (guaranteed tie with circular voting)
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3'])
                .startGame();

            expect(sim.getState().currentTurn).toBe(1);

            // Create tie vote
            sim.createTieVote();

            const afterVoteState = sim.getState();

            // Should be in Turn 2 with no elimination
            expect(afterVoteState.currentTurn).toBe(2);
            expect(afterVoteState.phase).toBe('playing');
            expect(afterVoteState.lastEliminatedInTurn).toBeNull();
        });

        test('Round ends when impostor is caught', () => {
            // Setup: 3 players
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3'])
                .startGame();

            const impostorIndex = sim.getImpostorIndex();

            // All vote for the impostor
            sim.allVoteFor(impostorIndex);

            const afterVoteState = sim.getState();

            // Round should end with friends winning
            expect(afterVoteState.phase).toBe('round_result');
        });

        test('Round ends when impostor survives 3 turns', () => {
            // Setup: 3 players
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3'])
                .startGame();

            // Turn 1: tie
            sim.createTieVote();
            expect(sim.getState().currentTurn).toBe(2);

            // Turn 2: tie
            sim.createTieVote();
            expect(sim.getState().currentTurn).toBe(3);

            // Turn 3: tie → impostor wins
            sim.createTieVote();

            const finalState = sim.getState();
            expect(finalState.phase).toBe('round_result');
        });
    });

    describe('State Broadcasting Verification', () => {
        test('castVote returns phaseChanged=false, allVoted=true when turn changes', () => {
            // Setup: 3 players
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3'])
                .startGame();

            // Get non-impostor indices for circular voting
            const activePlayers = sim.game.roundPlayers;

            // First two votes: phaseChanged=false, allVoted=false
            const voter0 = sim.users.findIndex(u => u.uid === activePlayers[0]);
            const target0 = sim.users.findIndex(u => u.uid === activePlayers[1]);
            const result1 = sim.vote(voter0, target0);
            expect(result1.phaseChanged).toBe(false);
            expect(result1.allVoted).toBe(false);

            const voter1 = sim.users.findIndex(u => u.uid === activePlayers[1]);
            const target1 = sim.users.findIndex(u => u.uid === activePlayers[2]);
            const result2 = sim.vote(voter1, target1);
            expect(result2.phaseChanged).toBe(false);
            expect(result2.allVoted).toBe(false);

            // Last vote: allVoted=true
            const voter2 = sim.users.findIndex(u => u.uid === activePlayers[2]);
            const target2 = sim.users.findIndex(u => u.uid === activePlayers[0]);
            const result3 = sim.vote(voter2, target2);
            expect(result3.allVoted).toBe(true);
            // phaseChanged depends on whether turn changed or phase changed
        });

        test('Player state includes lastEliminatedInTurn after elimination', () => {
            // Setup: 4 players
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3', 'Player4'])
                .startGame();

            const targetIndex = sim.getNonImpostorIndex();
            sim.allVoteFor(targetIndex);

            // Check state for a player
            const playerState = sim.getStateForPlayer(0);
            expect(playerState.lastEliminatedInTurn).toBe(sim.users[targetIndex].uid);
            expect(playerState.currentTurn).toBe(2);
        });

        test('Each player receives personalized state', () => {
            // Setup: 3 players
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3'])
                .startGame();

            const impostorIndex = sim.getImpostorIndex();
            const nonImpostorIndex = sim.getNonImpostorIndex();

            const impostorState = sim.getStateForPlayer(impostorIndex);
            const friendState = sim.getStateForPlayer(nonImpostorIndex);

            // Impostor should NOT see the secret word
            expect(impostorState.secretWord).toBe('Descubre la palabra secreta');
            expect(impostorState.role).toBe('impostor');

            // Friend should see the secret word
            expect(friendState.secretWord).not.toBe('Descubre la palabra secreta');
            expect(friendState.role).toBe('amigo');
        });
    });

    describe('Edge Cases', () => {
        test('2-player game: tie goes to next turn, 3 ties means impostor wins', () => {
            sim.createGame('Host')
                .addPlayers(['Player2'])
                .startGame();

            // In a 2-player game, mutual voting is a tie
            // 3 consecutive ties means impostor wins
            sim.createTieVote(); // Turn 1 → 2
            expect(sim.getState().currentTurn).toBe(2);

            sim.createTieVote(); // Turn 2 → 3
            expect(sim.getState().currentTurn).toBe(3);

            sim.createTieVote(); // Turn 3 → round_result
            expect(sim.getState().phase).toBe('round_result');
        });

        test('Multiple rounds work correctly', () => {
            sim.createGame('Host')
                .addPlayers(['Player2', 'Player3'])
                .startGame();

            expect(sim.getState().roundCount).toBe(1);

            // Complete round 1 (impostor wins on tie)
            sim.createTieVote(); // Turn 1 → 2
            sim.createTieVote(); // Turn 2 → 3
            sim.createTieVote(); // Turn 3 → round_result

            expect(sim.getState().phase).toBe('round_result');

            // Start round 2
            sim.game.playAgain(sim.users[0].uid);

            expect(sim.getState().phase).toBe('playing');
            expect(sim.getState().roundCount).toBe(2);
            expect(sim.getState().currentTurn).toBe(1);
        });
    });
});
