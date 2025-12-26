/**
 * Tests for RoundManager - New System
 * 
 * New system:
 * - 1 match = 3 rounds max
 * - Same impostor for entire match
 * - Each round is a single vote
 */

const RoundManager = require("../game/RoundManager");

// Helper to create a mock game object
function createMockGame() {
    return {
        gameId: "TEST1",
        players: [
            { uid: "user1", name: "Player 1" },
            { uid: "user2", name: "Player 2" },
            { uid: "user3", name: "Player 3" },
        ],
        playerScores: { user1: 0, user2: 0, user3: 0 },
        phase: "lobby",
        currentRound: 0,
        maxRounds: 3,
        impostorId: "",
        impostorHistory: [],
        eliminatedPlayers: [],
        votes: {},
        lastRoundScores: {},
        roundPlayers: [],
        roundHistory: [],
        playerOrder: ["user1", "user2", "user3"],
        formerPlayers: {},
        winnerId: null,
        persist: jest.fn(),
    };
}

describe("RoundManager - New System", () => {
    describe("selectImpostor", () => {
        test("should select an impostor from players", () => {
            const game = createMockGame();

            const impostor = RoundManager.selectImpostor(game);

            expect(["user1", "user2", "user3"]).toContain(impostor);
        });

        test("should exclude player who was impostor last 2 matches", () => {
            const game = createMockGame();
            game.impostorHistory = ["user1", "user1"]; // user1 was impostor twice

            const impostor = RoundManager.selectImpostor(game);

            // user1 should be excluded
            expect(impostor).not.toBe("user1");
        });

        test("should allow repeated impostor if fewer than 2 in history", () => {
            const game = createMockGame();
            game.impostorHistory = ["user1"]; // Only once

            const impostor = RoundManager.selectImpostor(game);

            // user1 can be selected
            expect(["user1", "user2", "user3"]).toContain(impostor);
        });
    });

    describe("startNewMatch", () => {
        test("should reset all scores to 0", () => {
            const game = createMockGame();
            game.playerScores = { user1: 5, user2: 3, user3: 2 };

            RoundManager.startNewMatch(game);

            expect(game.playerScores).toEqual({ user1: 0, user2: 0, user3: 0 });
        });

        test("should select a new impostor", () => {
            const game = createMockGame();

            RoundManager.startNewMatch(game);

            expect(game.impostorId).toBeTruthy();
            expect(["user1", "user2", "user3"]).toContain(game.impostorId);
        });

        test("should set currentRound to 1", () => {
            const game = createMockGame();

            RoundManager.startNewMatch(game);

            expect(game.currentRound).toBe(1);
        });

        test("should set phase to playing", () => {
            const game = createMockGame();

            RoundManager.startNewMatch(game);

            expect(game.phase).toBe("playing");
        });

        test("should clear eliminatedPlayers", () => {
            const game = createMockGame();
            game.eliminatedPlayers = ["user1"];

            RoundManager.startNewMatch(game);

            expect(game.eliminatedPlayers).toEqual([]);
        });

        test("should add impostor to history", () => {
            const game = createMockGame();

            RoundManager.startNewMatch(game);

            expect(game.impostorHistory[0]).toBe(game.impostorId);
        });
    });

    describe("startNextRound", () => {
        test("should increment currentRound", () => {
            const game = createMockGame();
            game.currentRound = 1;
            game.players = [{ uid: "user1" }, { uid: "user2" }];

            RoundManager.startNextRound(game);

            expect(game.currentRound).toBe(2);
        });

        test("should clear votes", () => {
            const game = createMockGame();
            game.currentRound = 1;
            game.votes = { user1: "user2" };

            RoundManager.startNextRound(game);

            expect(game.votes).toEqual({});
        });

        test("should set phase to playing", () => {
            const game = createMockGame();
            game.currentRound = 1;
            game.phase = "round_result";

            RoundManager.startNextRound(game);

            expect(game.phase).toBe("playing");
        });

        test("should select a new word", () => {
            const game = createMockGame();
            game.currentRound = 1;

            RoundManager.startNextRound(game);

            expect(game.secretWord).toBeTruthy();
            expect(game.secretCategory).toBeTruthy();
        });
    });

    describe("endRound - Impostor Caught", () => {
        test("should set phase to game_over when impostor caught", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.votes = { user2: "user1", user3: "user1" };

            RoundManager.endRound(game, true);

            expect(game.phase).toBe("game_over");
        });

        test("should set winnerId to friend with most points", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.playerScores = { user1: 0, user2: 4, user3: 2 };
            game.votes = { user2: "user1", user3: "user1" };

            RoundManager.endRound(game, true);

            expect(game.winnerId).toBe("user2");
        });
    });

    describe("endRound - Impostor Survives", () => {
        test("should set phase to round_result if not last round", () => {
            const game = createMockGame();
            game.currentRound = 1;
            game.maxRounds = 3;
            game.impostorId = "user1";

            RoundManager.endRound(game, false);

            expect(game.phase).toBe("round_result");
        });

        test("should set phase to game_over if last round", () => {
            const game = createMockGame();
            game.currentRound = 3;
            game.maxRounds = 3;
            game.impostorId = "user1";

            RoundManager.endRound(game, false);

            expect(game.phase).toBe("game_over");
        });

        test("should set winnerId to impostor if last round", () => {
            const game = createMockGame();
            game.currentRound = 3;
            game.maxRounds = 3;
            game.impostorId = "user1";

            RoundManager.endRound(game, false);

            expect(game.winnerId).toBe("user1");
        });
    });

    describe("handleSuddenDeath", () => {
        test("should set winnerId to impostor", () => {
            const game = createMockGame();
            game.impostorId = "user1";

            RoundManager.handleSuddenDeath(game);

            expect(game.winnerId).toBe("user1");
        });

        test("should set phase to game_over", () => {
            const game = createMockGame();
            game.impostorId = "user1";

            RoundManager.handleSuddenDeath(game);

            expect(game.phase).toBe("game_over");
        });

        test("should give impostor max points", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.playerScores = { user1: 3 };

            RoundManager.handleSuddenDeath(game);

            expect(game.playerScores["user1"]).toBe(7);
        });
    });

    describe("MAX_ROUNDS constant", () => {
        test("should be 3", () => {
            expect(RoundManager.MAX_ROUNDS).toBe(3);
        });
    });
});
