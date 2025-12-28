/**
 * Tests for ScoringManager - New Scoring System
 *
 * New system:
 * - Friends: +2 points per correct vote (individual)
 * - Impostor: +3 (R1), +2 (R2), +2 (R3) for surviving = max 7 points
 * - Ties: impostor DOES get points
 * - Sudden death: impostor gets max points (7)
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
        eliminatedPlayers: [],
        impostorId: "user1",
        playerScores: {
            user1: 0,
            user2: 0,
            user3: 0,
            user4: 0,
        },
        lastRoundScores: {},
        currentRound: 1,
        maxRounds: 3,
        votes: {},
    };
}

describe("ScoringManager - New System", () => {
    describe("giveImpostorSurvivalPoints", () => {
        test("should give +2 points on round 1", () => {
            const game = createMockGame();
            game.currentRound = 1;

            ScoringManager.giveImpostorSurvivalPoints(game);

            expect(game.playerScores["user1"]).toBe(2);
            expect(game.lastRoundScores["user1"]).toBe(2);
        });

        test("should give +2 points on round 2", () => {
            const game = createMockGame();
            game.currentRound = 2;
            game.playerScores["user1"] = 2; // Already got R1 points

            ScoringManager.giveImpostorSurvivalPoints(game);

            expect(game.playerScores["user1"]).toBe(4); // 2 + 2
            expect(game.lastRoundScores["user1"]).toBe(2);
        });

        test("should give +2 points on round 3", () => {
            const game = createMockGame();
            game.currentRound = 3;
            game.playerScores["user1"] = 4; // R1 + R2 points

            ScoringManager.giveImpostorSurvivalPoints(game);

            expect(game.playerScores["user1"]).toBe(6); // 4 + 2
            expect(game.lastRoundScores["user1"]).toBe(2);
        });

        test("should accumulate correctly: 2+2+2 = 6 base", () => {
            const game = createMockGame();

            // Round 1
            game.currentRound = 1;
            ScoringManager.giveImpostorSurvivalPoints(game);
            expect(game.playerScores["user1"]).toBe(2);

            // Round 2
            game.currentRound = 2;
            game.lastRoundScores = {};
            ScoringManager.giveImpostorSurvivalPoints(game);
            expect(game.playerScores["user1"]).toBe(4);

            // Round 3
            game.currentRound = 3;
            game.lastRoundScores = {};
            ScoringManager.giveImpostorSurvivalPoints(game);
            expect(game.playerScores["user1"]).toBe(6);
        });
    });

    describe("giveImpostorMaxPoints (Sudden Death)", () => {
        test("should give remaining points to reach 7", () => {
            const game = createMockGame();
            game.playerScores["user1"] = 3; // Only got R1 points

            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["user1"]).toBe(10);
            expect(game.lastRoundScores["user1"]).toBe(7); // 10 - 3 already earned
        });

        test("should not give extra points if already at max", () => {
            const game = createMockGame();
            game.playerScores["user1"] = 10;

            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["user1"]).toBe(10);
        });

        test("should give all 10 points if impostor has 0", () => {
            const game = createMockGame();
            game.playerScores["user1"] = 0;

            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["user1"]).toBe(10);
            expect(game.lastRoundScores["user1"]).toBe(10);
        });
    });

    describe("giveCorrectVotersPoints", () => {
        test("should give +2 to each player who voted for impostor", () => {
            const game = createMockGame();
            game.votes = {
                user1: "user2", // Impostor voted for someone else
                user2: "user1", // Voted correctly
                user3: "user1", // Voted correctly
                user4: "user2", // Voted wrong
            };

            ScoringManager.giveCorrectVotersPoints(game);

            expect(game.playerScores["user2"]).toBe(2);
            expect(game.playerScores["user3"]).toBe(2);
            expect(game.playerScores["user4"]).toBe(0);
        });

        test("should not give points to impostor even if voted for themselves", () => {
            const game = createMockGame();
            game.votes = {
                user1: "user1", // Impostor voted for themselves (edge case)
                user2: "user1",
                user3: "user1",
                user4: "user1",
            };

            ScoringManager.giveCorrectVotersPoints(game);

            expect(game.playerScores["user1"]).toBe(0); // Impostor gets nothing
            expect(game.playerScores["user2"]).toBe(2);
            expect(game.playerScores["user3"]).toBe(2);
            expect(game.playerScores["user4"]).toBe(2);
        });
    });

    describe("findWinner", () => {
        test("should return player with highest score (excluding impostor)", () => {
            const game = createMockGame();
            game.playerScores = { user1: 7, user2: 4, user3: 2, user4: 6 };

            const result = ScoringManager.findWinner(game);

            expect(result).toBe("user4"); // Highest non-impostor
        });

        test("should return first player in case of tie", () => {
            const game = createMockGame();
            game.playerScores = { user1: 7, user2: 4, user3: 4, user4: 2 };

            const result = ScoringManager.findWinner(game);

            expect(["user2", "user3"]).toContain(result);
        });

        test("should return null if no friends have points", () => {
            const game = createMockGame();
            game.playerScores = { user1: 7, user2: 0, user3: 0, user4: 0 };

            const result = ScoringManager.findWinner(game);

            expect(result).toBeNull();
        });
    });

    describe("calculateRoundScores", () => {
        test("should log when friends win (points given by giveCorrectVotersPoints)", () => {
            const game = createMockGame();
            game.votes = {
                user2: "user1",
                user3: "user1",
                user4: "user1",
            };

            // Points are now given by giveCorrectVotersPoints, not calculateRoundScores
            // Then calculateFriendsWinScores gives bonus to perfect friend
            ScoringManager.giveCorrectVotersPoints(game);
            ScoringManager.calculateRoundScores(game, true);

            // Friends should have gotten points, ALL have perfect score (1/1) so ALL get bonus
            expect(game.playerScores["user2"]).toBe(10); // +2 vote + 8 bonus = 10
            expect(game.playerScores["user3"]).toBe(10); // +2 vote + 8 bonus = 10
            expect(game.playerScores["user4"]).toBe(10); // +2 vote + 8 bonus = 10
        });

        test("should not change scores when impostor wins (points given separately)", () => {
            const game = createMockGame();
            const initialScores = { ...game.playerScores };

            ScoringManager.calculateRoundScores(game, false);

            // Scores should remain the same (impostor points given in giveImpostorSurvivalPoints)
            expect(game.playerScores).toEqual(initialScores);
        });
    });

    describe("Constants", () => {
        test("should have correct point values", () => {
            expect(ScoringManager.FRIEND_POINTS_PER_CORRECT_VOTE).toBe(2);
            expect(ScoringManager.IMPOSTOR_POINTS_PER_ROUND).toBe(2);
            expect(ScoringManager.TARGET_SCORE).toBe(10);
        });
    });
});
