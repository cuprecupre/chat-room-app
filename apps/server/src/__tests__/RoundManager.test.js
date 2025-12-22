/**
 * Tests for RoundManager
 */

const RoundManager = require("../game/RoundManager");

// Mock dependencies
jest.mock("../words", () => ({
    getRandomWordWithCategory: jest.fn(() => ({
        word: "pizza",
        category: "Comida",
    })),
}));

jest.mock("../game/ScoringManager", () => ({
    calculateRoundScores: jest.fn(),
    checkGameOver: jest.fn(() => null),
}));

jest.mock("../game/PlayerManager", () => ({
    calculateStartingPlayer: jest.fn(() => "user1"),
}));

const { getRandomWordWithCategory } = require("../words");
const { calculateRoundScores, checkGameOver } = require("../game/ScoringManager");
const { calculateStartingPlayer } = require("../game/PlayerManager");

// Helper to create a mock game object
function createMockGame() {
    return {
        gameId: "TEST1",
        players: [
            { uid: "user1", name: "Player 1" },
            { uid: "user2", name: "Player 2" },
            { uid: "user3", name: "Player 3" },
        ],
        roundPlayers: [],
        eliminatedInRound: [],
        votes: {},
        currentTurn: 1,
        maxTurns: 3,
        turnHistory: [],
        impostorId: null,
        impostorHistory: [],
        lastEliminatedInTurn: null,
        roundCount: 0,
        secretWord: "",
        secretCategory: "",
        startingPlayerId: null,
        phase: "lobby",
        playerScores: { user1: 0, user2: 0, user3: 0 },
        lastRoundScores: {},
    };
}

describe("RoundManager", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("startNewRound", () => {
        test("should initialize round state", () => {
            const game = createMockGame();

            RoundManager.startNewRound(game);

            expect(game.roundPlayers).toEqual(["user1", "user2", "user3"]);
            expect(game.currentTurn).toBe(1);
            expect(game.eliminatedInRound).toEqual([]);
            expect(game.votes).toEqual({});
            expect(game.turnHistory).toEqual([]);
            expect(game.lastRoundScores).toEqual({});
        });

        test("should increment round count", () => {
            const game = createMockGame();
            game.roundCount = 1;

            RoundManager.startNewRound(game);

            expect(game.roundCount).toBe(2);
        });

        test("should set starting player", () => {
            const game = createMockGame();
            calculateStartingPlayer.mockReturnValue("user2");

            RoundManager.startNewRound(game);

            expect(game.startingPlayerId).toBe("user2");
        });

        test("should select an impostor", () => {
            const game = createMockGame();

            RoundManager.startNewRound(game);

            expect(game.impostorId).toBeTruthy();
            expect(game.roundPlayers).toContain(game.impostorId);
        });

        test("should add impostor to history", () => {
            const game = createMockGame();

            RoundManager.startNewRound(game);

            expect(game.impostorHistory).toContain(game.impostorId);
            expect(game.impostorHistory[0]).toBe(game.impostorId);
        });

        test("should select a word and category", () => {
            const game = createMockGame();
            getRandomWordWithCategory.mockReturnValue({
                word: "pizza",
                category: "Comida",
            });

            RoundManager.startNewRound(game);

            expect(game.secretWord).toBe("pizza");
            expect(game.secretCategory).toBe("Comida");
        });

        test("should set phase to playing", () => {
            const game = createMockGame();

            RoundManager.startNewRound(game);

            expect(game.phase).toBe("playing");
        });

        test("should limit impostor history to 10 entries", () => {
            const game = createMockGame();
            game.impostorHistory = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

            RoundManager.startNewRound(game);

            expect(game.impostorHistory.length).toBeLessThanOrEqual(10);
        });
    });

    describe("selectImpostorWithLimit", () => {
        test("should exclude player who was impostor last 2 times", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1", "user2", "user3"];
            game.impostorHistory = ["user1", "user1"]; // user1 was impostor twice

            // Run multiple times to check exclusion
            const results = new Set();
            for (let i = 0; i < 20; i++) {
                const impostor = RoundManager.selectImpostorWithLimit(game);
                results.add(impostor);
            }

            expect(results.has("user1")).toBe(false);
            expect(results.has("user2")).toBe(true);
            expect(results.has("user3")).toBe(true);
        });

        test("should not exclude if last 2 impostors are different", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1", "user2", "user3"];
            game.impostorHistory = ["user1", "user2"];

            const results = new Set();
            for (let i = 0; i < 30; i++) {
                const impostor = RoundManager.selectImpostorWithLimit(game);
                results.add(impostor);
            }

            // All players should be possible
            expect(results.size).toBe(3);
        });

        test("should allow all players if exclusion would leave no candidates", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1"]; // Only one player
            game.impostorHistory = ["user1", "user1"];

            const impostor = RoundManager.selectImpostorWithLimit(game);

            expect(impostor).toBe("user1");
        });
    });

    describe("startNextTurn", () => {
        test("should increment turn counter", () => {
            const game = createMockGame();
            game.currentTurn = 1;

            RoundManager.startNextTurn(game);

            expect(game.currentTurn).toBe(2);
        });

        test("should clear votes", () => {
            const game = createMockGame();
            game.votes = { user1: "user2", user2: "user3" };

            RoundManager.startNextTurn(game);

            expect(game.votes).toEqual({});
        });

        test("should give impostor points for surviving turn (not tie)", () => {
            const game = createMockGame();
            game.currentTurn = 1;
            game.impostorId = "user1";
            game.playerScores = { user1: 0 };
            game.lastRoundScores = {};

            RoundManager.startNextTurn(game, false); // wasTie = false

            // Survived turn 1, gets turn + 1 = 2 points
            expect(game.playerScores["user1"]).toBe(2);
            expect(game.lastRoundScores["user1"]).toBe(2);
        });

        test("should NOT give impostor points when tie", () => {
            const game = createMockGame();
            game.currentTurn = 1;
            game.impostorId = "user1";
            game.playerScores = { user1: 0 };
            game.lastRoundScores = {};

            RoundManager.startNextTurn(game, true); // wasTie = true

            expect(game.playerScores["user1"]).toBe(0);
        });

        test("should accumulate impostor survival points", () => {
            const game = createMockGame();
            game.currentTurn = 2;
            game.impostorId = "user1";
            game.playerScores = { user1: 2 }; // Already has 2 from turn 1
            game.lastRoundScores = { user1: 2 };

            RoundManager.startNextTurn(game, false);

            // Survived turn 2, gets 3 more points
            expect(game.playerScores["user1"]).toBe(5); // 2 + 3
        });
    });

    describe("endRound", () => {
        test("should call calculateRoundScores with friendsWon", () => {
            const game = createMockGame();

            RoundManager.endRound(game, true);

            expect(calculateRoundScores).toHaveBeenCalledWith(game, true);
        });

        test("should set phase to round_result when game not over", () => {
            const game = createMockGame();
            checkGameOver.mockReturnValue(null);

            RoundManager.endRound(game, true);

            expect(game.phase).toBe("round_result");
        });

        test("should set phase to game_over when someone wins", () => {
            const game = createMockGame();
            checkGameOver.mockReturnValue("user2");

            RoundManager.endRound(game, true);

            expect(game.phase).toBe("game_over");
        });
    });
});
