/**
 * Integration tests for Turn Transitions
 * LOCAL ONLY - Do not commit to repository
 */

const { GameSimulator } = require("./GameSimulator");

describe("Turn Transitions (Integration)", () => {
    let sim;

    beforeEach(() => {
        sim = new GameSimulator();
    });

    describe("Basic Turn Flow", () => {
        test("Turn 1 → Turn 2 when non-impostor is eliminated", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3", "Player4"]).startGame();
            expect(sim.getState().currentTurn).toBe(1);

            const targetIndex = sim.getNonImpostorIndex();
            sim.allVoteFor(targetIndex);

            expect(sim.getState().currentTurn).toBe(2);
            expect(sim.getState().phase).toBe("playing");
            expect(sim.getState().lastEliminatedInTurn).toBe(sim.users[targetIndex].uid);
        });

        test("Turn 1 → Turn 2 on tie (no elimination)", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();
            sim.createTieVote();

            expect(sim.getState().currentTurn).toBe(2);
            expect(sim.getState().phase).toBe("playing");
            expect(sim.getState().lastEliminatedInTurn).toBeNull();
        });

        test("Round ends when impostor is caught", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();
            sim.allVoteFor(sim.getImpostorIndex());

            expect(sim.getState().phase).toBe("round_result");
        });

        test("Round ends when impostor survives 3 turns", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            sim.createTieVote();
            expect(sim.getState().currentTurn).toBe(2);

            sim.createTieVote();
            expect(sim.getState().currentTurn).toBe(3);

            sim.createTieVote();
            expect(sim.getState().phase).toBe("round_result");
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

        test("Player state includes lastEliminatedInTurn after elimination", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3", "Player4"]).startGame();

            const targetIndex = sim.getNonImpostorIndex();
            sim.allVoteFor(targetIndex);

            const playerState = sim.getStateForPlayer(0);
            expect(playerState.lastEliminatedInTurn).toBe(sim.users[targetIndex].uid);
            expect(playerState.currentTurn).toBe(2);
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

    describe("Edge Cases", () => {
        test("2-player game: 3 ties means impostor wins", () => {
            sim.createGame("Host").addPlayers(["Player2"]).startGame();

            sim.createTieVote();
            expect(sim.getState().currentTurn).toBe(2);

            sim.createTieVote();
            expect(sim.getState().currentTurn).toBe(3);

            sim.createTieVote();
            expect(sim.getState().phase).toBe("round_result");
        });

        test("Multiple rounds work correctly", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            sim.createTieVote();
            sim.createTieVote();
            sim.createTieVote();

            expect(sim.getState().phase).toBe("round_result");

            sim.game.playAgain(sim.users[0].uid);

            expect(sim.getState().phase).toBe("playing");
            expect(sim.getState().roundCount).toBe(2);
            expect(sim.getState().currentTurn).toBe(1);
        });
    });
});
