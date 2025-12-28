/**
 * Integration tests for Round Transitions
 * Updated for new system: 3 rounds, same impostor, no turns
 */

const { GameSimulator } = require("./GameSimulator");

describe("Round Transitions (Integration)", () => {
    let sim;

    beforeEach(() => {
        sim = new GameSimulator();
    });

    describe("Basic Round Flow", () => {
        test("Round 1 starts with same impostor for entire match", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3", "Player4"]).startGame();

            expect(sim.getState().currentRound).toBe(1);
            expect(sim.getState().phase).toBe("playing");
            expect(sim.getState().impostorId).toBeTruthy();
        });

        test("Eliminating non-impostor ends round (impostor survives)", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3", "Player4"]).startGame();
            const initialImpostor = sim.getState().impostorId;

            const targetIndex = sim.getNonImpostorIndex();
            sim.allVoteFor(targetIndex);

            // Round ends but game continues
            expect(sim.getState().eliminatedPlayers).toContain(sim.users[targetIndex].uid);
            expect(sim.getState().impostorId).toBe(initialImpostor);
        });

        test("Tie gives impostor points and continues to next round", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            sim.createTieVote();

            // Impostor gets R1 points (2)
            const impostorId = sim.getState().impostorId;
            expect(sim.getState().playerScores[impostorId]).toBe(2);
            expect(sim.getState().phase).toBe("round_result");
        });

        test("Game ends when impostor is caught", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            sim.allVoteFor(sim.getImpostorIndex());

            expect(sim.getState().phase).toBe("game_over");
            expect(sim.getState().winnerId).not.toBe(sim.getState().impostorId);
        });

        test("Impostor wins if survives 3 rounds with ties", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            // Round 1: tie
            sim.createTieVote();
            expect(sim.getState().phase).toBe("round_result");
            sim.continueToNextRound();
            expect(sim.getState().currentRound).toBe(2);

            // Round 2: tie
            sim.createTieVote();
            sim.continueToNextRound();
            expect(sim.getState().currentRound).toBe(3);

            // Round 3: tie - game ends
            sim.createTieVote();
            expect(sim.getState().phase).toBe("game_over");
            expect(sim.getState().winnerId).toBe(sim.getState().impostorId);
        });
    });

    describe("Scoring", () => {
        test("Impostor gets 2+2+6(bonus) = 10 points for surviving all rounds", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();
            const impostorId = sim.getState().impostorId;

            // Survive all 3 rounds with ties
            sim.createTieVote();
            expect(sim.getState().playerScores[impostorId]).toBe(2); // R1

            sim.continueToNextRound();
            sim.createTieVote();
            expect(sim.getState().playerScores[impostorId]).toBe(4); // R1 + R2

            sim.continueToNextRound();
            sim.createTieVote();
            expect(sim.getState().playerScores[impostorId]).toBe(10); // Final score with bonus
        });

        test("Friends get +2 for correct vote when catching impostor", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            sim.allVoteFor(sim.getImpostorIndex());

            // Friends who voted correctly get +2
            // One of them will be the "Perfect Friend" and get bonus to 10
            const scores = sim.getState().playerScores;
            const impostorId = sim.getState().impostorId;

            const friendScores = Object.entries(scores)
                .filter(([id]) => id !== impostorId)
                .map(([, score]) => score);

            expect(friendScores).toContain(10); // Winner
            expect(friendScores).toContain(2); // Other friend who voted right
        });
    });

    describe("State Broadcasting", () => {
        test("castVote returns allVoted=true when all vote", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            const activePlayers = sim.game.roundPlayers;
            const voter0 = sim.users.findIndex((u) => u.uid === activePlayers[0]);
            const target0 = sim.users.findIndex((u) => u.uid === activePlayers[1]);
            const result1 = sim.vote(voter0, target0);
            expect(result1.allVoted).toBe(false);

            const voter1 = sim.users.findIndex((u) => u.uid === activePlayers[1]);
            const target1 = sim.users.findIndex((u) => u.uid === activePlayers[2]);
            const result2 = sim.vote(voter1, target1);
            expect(result2.allVoted).toBe(false);

            const voter2 = sim.users.findIndex((u) => u.uid === activePlayers[2]);
            const target2 = sim.users.findIndex((u) => u.uid === activePlayers[0]);
            const result3 = sim.vote(voter2, target2);
            expect(result3.allVoted).toBe(true);
        });

        test("Impostor and friends see different info", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            const impostorState = sim.getStateForPlayer(sim.getImpostorIndex());
            const friendState = sim.getStateForPlayer(sim.getNonImpostorIndex());

            expect(impostorState.role).toBe("impostor");
            expect(impostorState.secretWord).toBe("Descubre la palabra secreta");

            expect(friendState.role).toBe("amigo");
            expect(friendState.secretWord).not.toBe("Descubre la palabra secreta");
        });
    });

    describe("Sudden Death", () => {
        test("Impostor wins with max points when only 2 players left", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();
            const impostorId = sim.getState().impostorId;

            // Eliminate a friend (not impostor)
            const friendIndex = sim.getNonImpostorIndex();
            sim.allVoteFor(friendIndex);

            // Should trigger sudden death
            expect(sim.getState().phase).toBe("game_over");
            expect(sim.getState().winnerId).toBe(impostorId);
            expect(sim.getState().playerScores[impostorId]).toBe(10);
        });
    });

    describe("New Match (Play Again)", () => {
        test("playAgain resets scores and selects new impostor", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            // End the game somehow
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            expect(sim.getState().phase).toBe("game_over");

            // Play again
            sim.playAgain();

            expect(sim.getState().phase).toBe("playing");
            expect(sim.getState().currentRound).toBe(1);

            // Scores should be reset
            const scores = sim.getState().playerScores;
            Object.values(scores).forEach((score) => {
                expect(score).toBe(0);
            });
        });
    });
});
