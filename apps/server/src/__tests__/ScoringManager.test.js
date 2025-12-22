/**
 * Tests for ScoringManager
 */

const ScoringManager = require("../game/ScoringManager");

// Helper to create a mock game object
function createMockGame() {
    return {
        gameId: "TEST1",
        players: [
            { uid: "user1", name: "Player 1" },
            { uid: "user2", name: "Player 2" },
            { uid: "user3", name: "Player 3" },
            { uid: "user4", name: "Player 4" },
        ],
        roundPlayers: ["user1", "user2", "user3", "user4"],
        eliminatedInRound: [],
        impostorId: "user1",
        playerScores: {
            user1: 0,
            user2: 0,
            user3: 0,
            user4: 0,
        },
        lastRoundScores: {},
        roundCount: 1,
        maxRounds: 3,
        targetScore: 15,
        currentTurn: 1,
        turnHistory: [],
    };
}

describe("ScoringManager", () => {
    describe("calculateRoundScores - Friends Win", () => {
        test("should give +1 to players who voted for impostor", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.turnHistory = [
                {
                    turn: 1,
                    votes: {
                        user1: "user2", // Impostor voted for someone else
                        user2: "user1", // Voted correctly
                        user3: "user1", // Voted correctly
                        user4: "user2", // Voted wrong
                    },
                },
            ];

            ScoringManager.calculateRoundScores(game, true); // friendsWon = true

            // user2 and user3 voted correctly: +1 each
            expect(game.lastRoundScores["user2"]).toBeGreaterThanOrEqual(1);
            expect(game.lastRoundScores["user3"]).toBeGreaterThanOrEqual(1);
        });

        test("should give +1 bonus to all non-impostor survivors for winning", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.eliminatedInRound = ["user1"]; // Impostor eliminated
            game.turnHistory = [
                {
                    turn: 1,
                    votes: {
                        user1: "user2",
                        user2: "user1",
                        user3: "user1",
                        user4: "user1",
                    },
                },
            ];

            ScoringManager.calculateRoundScores(game, true);

            // All surviving friends get +1 bonus
            expect(game.lastRoundScores["user2"]).toBeGreaterThan(0);
            expect(game.lastRoundScores["user3"]).toBeGreaterThan(0);
            expect(game.lastRoundScores["user4"]).toBeGreaterThan(0);
        });

        test("should not give bonus to eliminated players", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.eliminatedInRound = ["user2"]; // user2 was eliminated before impostor
            game.turnHistory = [
                {
                    turn: 1,
                    votes: {
                        user1: "user3",
                        user2: "user1", // Voted correctly but eliminated
                        user3: "user1",
                        user4: "user1",
                    },
                },
            ];

            ScoringManager.calculateRoundScores(game, true);

            // user2 should not get the survival bonus (but may get vote bonus)
            // The bonus for surviving is only for non-eliminated players
            expect(game.lastRoundScores["user2"] || 0).toBeLessThanOrEqual(1);
        });
    });

    describe("calculateRoundScores - Impostor Wins", () => {
        test("should give impostor points based on turn (turn 1 = 2 points)", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.currentTurn = 1;
            game.turnHistory = [];

            ScoringManager.calculateRoundScores(game, false); // friendsWon = false

            // Turn 1: impostor gets currentTurn + 1 = 2 points
            expect(game.lastRoundScores["user1"]).toBe(2);
        });

        test("should give impostor more points for surviving longer (turn 2 = 3 points)", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.currentTurn = 2;
            game.turnHistory = [];

            ScoringManager.calculateRoundScores(game, false);

            // Turn 2: impostor gets currentTurn + 1 = 3 points
            expect(game.lastRoundScores["user1"]).toBe(3);
        });

        test("should give impostor max points on turn 3 (4 points)", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.currentTurn = 3;
            game.turnHistory = [];

            ScoringManager.calculateRoundScores(game, false);

            // Turn 3: impostor gets currentTurn + 1 = 4 points
            expect(game.lastRoundScores["user1"]).toBe(4);
        });

        test("should still give +1 to friends who voted correctly even when impostor wins", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.currentTurn = 1;
            game.turnHistory = [
                {
                    turn: 1,
                    votes: {
                        user1: "user2",
                        user2: "user1", // Voted correctly
                        user3: "user2", // Voted wrong
                        user4: "user1", // Voted correctly
                    },
                },
            ];

            ScoringManager.calculateRoundScores(game, false);

            expect(game.lastRoundScores["user2"]).toBe(1);
            expect(game.lastRoundScores["user4"]).toBe(1);
            expect(game.lastRoundScores["user3"]).toBeUndefined();
        });

        test("should accumulate points in playerScores", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.playerScores = { user1: 5, user2: 3, user3: 2, user4: 1 };
            game.currentTurn = 2;
            game.turnHistory = [];

            ScoringManager.calculateRoundScores(game, false);

            expect(game.playerScores["user1"]).toBe(8); // 5 + 3
        });
    });

    describe("checkGameOver", () => {
        test("should return winner when target score reached", () => {
            const game = createMockGame();
            game.playerScores = { user1: 15, user2: 8, user3: 5, user4: 3 };
            game.targetScore = 15;

            const result = ScoringManager.checkGameOver(game);

            expect(result).toBe("user1");
        });

        test("should return first player to reach target in case of tie", () => {
            const game = createMockGame();
            game.playerScores = { user1: 15, user2: 16, user3: 5, user4: 3 };
            game.targetScore = 15;

            const result = ScoringManager.checkGameOver(game);

            // Should return one of the players who reached target
            expect(["user1", "user2"]).toContain(result);
        });

        test("should return winner when max rounds reached with clear leader", () => {
            const game = createMockGame();
            game.roundCount = 3;
            game.maxRounds = 3;
            game.playerScores = { user1: 8, user2: 12, user3: 5, user4: 3 };
            game.targetScore = 15;

            const result = ScoringManager.checkGameOver(game);

            expect(result).toBe("user2");
        });

        test("should return null when max rounds reached with tie", () => {
            const game = createMockGame();
            game.roundCount = 3;
            game.maxRounds = 3;
            game.playerScores = { user1: 8, user2: 8, user3: 5, user4: 3 };
            game.targetScore = 15;

            const result = ScoringManager.checkGameOver(game);

            expect(result).toBeNull();
        });

        test("should return null when game not over", () => {
            const game = createMockGame();
            game.roundCount = 1;
            game.maxRounds = 3;
            game.playerScores = { user1: 5, user2: 3, user3: 2, user4: 1 };
            game.targetScore = 15;

            const result = ScoringManager.checkGameOver(game);

            expect(result).toBeNull();
        });

        test("should not end game if no one has points", () => {
            const game = createMockGame();
            game.roundCount = 1;
            game.maxRounds = 3;
            game.playerScores = {};
            game.targetScore = 15;

            const result = ScoringManager.checkGameOver(game);

            expect(result).toBeNull();
        });
    });
});
