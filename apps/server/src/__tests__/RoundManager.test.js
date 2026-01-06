/**
 * Tests for RoundManager - New System
 *
 * New system:
 * - 1 match = 3 rounds max
 * - Same impostor for entire match
 * - Each round is a single vote
 */

const RoundManager = require("../game/RoundManager");

// Helper to create a mock match object
function createMockMatch() {
    return {
        matchId: "TEST1",
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
        persistAnalytics: jest.fn(),
    };
}

describe("RoundManager - New System", () => {
    describe("selectImpostor", () => {
        test("should select an impostor from players", () => {
            const match = createMockMatch();

            const impostor = RoundManager.selectImpostor(match);

            expect(["user1", "user2", "user3"]).toContain(impostor);
        });

        test("should exclude player who was impostor last 2 matches", () => {
            const match = createMockMatch();
            match.impostorHistory = ["user1", "user1"]; // user1 was impostor twice

            const impostor = RoundManager.selectImpostor(match);

            // user1 should be excluded
            expect(impostor).not.toBe("user1");
        });

        test("should allow repeated impostor if fewer than 2 in history", () => {
            const match = createMockMatch();
            match.impostorHistory = ["user1"]; // Only once

            const impostor = RoundManager.selectImpostor(match);

            // user1 can be selected
            expect(["user1", "user2", "user3"]).toContain(impostor);
        });
    });

    describe("startNewMatch", () => {
        test("should reset all scores to 0", () => {
            const match = createMockMatch();
            match.playerScores = { user1: 5, user2: 3, user3: 2 };

            RoundManager.startNewMatch(match);

            expect(match.playerScores).toEqual({ user1: 0, user2: 0, user3: 0 });
        });

        test("should select a new impostor", () => {
            const match = createMockMatch();

            RoundManager.startNewMatch(match);

            expect(match.impostorId).toBeTruthy();
            expect(["user1", "user2", "user3"]).toContain(match.impostorId);
        });

        test("should set currentRound to 1", () => {
            const match = createMockMatch();

            RoundManager.startNewMatch(match);

            expect(match.currentRound).toBe(1);
        });

        test("should set phase to playing", () => {
            const match = createMockMatch();

            RoundManager.startNewMatch(match);

            expect(match.phase).toBe("playing");
        });

        test("should clear eliminatedPlayers", () => {
            const match = createMockMatch();
            match.eliminatedPlayers = ["user1"];

            RoundManager.startNewMatch(match);

            expect(match.eliminatedPlayers).toEqual([]);
        });

        test("should add impostor to history", () => {
            const match = createMockMatch();

            RoundManager.startNewMatch(match);

            expect(match.impostorHistory[0]).toBe(match.impostorId);
        });
    });

    describe("startNextRound", () => {
        test("should increment currentRound", () => {
            const match = createMockMatch();
            match.currentRound = 1;
            match.players = [{ uid: "user1" }, { uid: "user2" }];

            RoundManager.startNextRound(match);

            expect(match.currentRound).toBe(2);
        });

        test("should clear votes", () => {
            const match = createMockMatch();
            match.currentRound = 1;
            match.votes = { user1: "user2" };

            RoundManager.startNextRound(match);

            expect(match.votes).toEqual({});
        });

        test("should set phase to playing", () => {
            const match = createMockMatch();
            match.currentRound = 1;
            match.phase = "round_result";

            RoundManager.startNextRound(match);

            expect(match.phase).toBe("playing");
        });

        test("should NOT change the word (word selected in startNewMatch)", () => {
            const match = createMockMatch();
            match.currentRound = 1;
            match.secretWord = "existing-word";
            match.secretCategory = "existing-category";

            RoundManager.startNextRound(match);

            // Word should remain the same across rounds
            expect(match.secretWord).toBe("existing-word");
            expect(match.secretCategory).toBe("existing-category");
        });
    });

    describe("endRound - Impostor Caught", () => {
        test("should set phase to game_over when impostor caught", () => {
            const match = createMockMatch();
            match.impostorId = "user1";
            match.votes = { user2: "user1", user3: "user1" };

            RoundManager.endRound(match, true);

            expect(match.phase).toBe("game_over");
        });

        test("should set winnerId to friend with most points", () => {
            const match = createMockMatch();
            match.impostorId = "user1";
            match.playerScores = { user1: 0, user2: 4, user3: 2 };
            match.votes = { user2: "user1", user3: "user1" };

            RoundManager.endRound(match, true);

            expect(match.winnerId).toBe("user2");
        });
    });

    describe("endRound - Impostor Survives", () => {
        test("should set phase to round_result if not last round", () => {
            const match = createMockMatch();
            match.currentRound = 1;
            match.maxRounds = 3;
            match.impostorId = "user1";

            RoundManager.endRound(match, false);

            expect(match.phase).toBe("round_result");
        });

        test("should set phase to game_over if last round", () => {
            const match = createMockMatch();
            match.currentRound = 3;
            match.maxRounds = 3;
            match.impostorId = "user1";

            RoundManager.endRound(match, false);

            expect(match.phase).toBe("game_over");
        });

        test("should set winnerId to impostor if last round", () => {
            const match = createMockMatch();
            match.currentRound = 3;
            match.maxRounds = 3;
            match.impostorId = "user1";

            RoundManager.endRound(match, false);

            expect(match.winnerId).toBe("user1");
        });
    });

    describe("handleSuddenDeath", () => {
        test("should set winnerId to impostor", () => {
            const match = createMockMatch();
            match.impostorId = "user1";

            RoundManager.handleSuddenDeath(match);

            expect(match.winnerId).toBe("user1");
        });

        test("should set phase to game_over", () => {
            const match = createMockMatch();
            match.impostorId = "user1";

            RoundManager.handleSuddenDeath(match);

            expect(match.phase).toBe("game_over");
        });

        test("should give impostor max points", () => {
            const match = createMockMatch();
            match.impostorId = "user1";
            match.playerScores = { user1: 3 };

            RoundManager.handleSuddenDeath(match);

            expect(match.playerScores["user1"]).toBe(10);
        });
    });

    describe("MAX_ROUNDS constant", () => {
        test("should be 3", () => {
            expect(RoundManager.MAX_ROUNDS).toBe(3);
        });
    });

    // Integration Tests
    describe("Integration - Word Persistence", () => {
        test("word should remain the same across all 3 rounds", () => {
            const match = createMockMatch();

            // Start new match - word is selected
            RoundManager.startNewMatch(match);
            const initialWord = match.secretWord;
            const initialCategory = match.secretCategory;

            expect(initialWord).toBeTruthy();
            expect(initialCategory).toBeTruthy();

            // Advance to round 2
            match.phase = "round_result";
            RoundManager.startNextRound(match);

            expect(match.currentRound).toBe(2);
            expect(match.secretWord).toBe(initialWord);
            expect(match.secretCategory).toBe(initialCategory);

            // Advance to round 3
            match.phase = "round_result";
            RoundManager.startNextRound(match);

            expect(match.currentRound).toBe(3);
            expect(match.secretWord).toBe(initialWord);
            expect(match.secretCategory).toBe(initialCategory);
        });
    });

    describe("Integration - Impostor Disconnection", () => {
        test("game should end immediately when impostor disconnects during play", () => {
            const PlayerManager = require("../game/PlayerManager");
            const match = createMockMatch();

            // Setup: Add players and start match
            PlayerManager.addPlayer(match, { uid: "user1", name: "Player 1", photoURL: null });
            PlayerManager.addPlayer(match, { uid: "user2", name: "Player 2", photoURL: null });
            PlayerManager.addPlayer(match, { uid: "user3", name: "Player 3", photoURL: null });

            RoundManager.startNewMatch(match);
            const impostorId = match.impostorId;

            expect(match.phase).toBe("playing");
            expect(match.currentRound).toBe(1);

            // Action: Impostor disconnects
            PlayerManager.removePlayer(match, impostorId);

            // Assertion: Game should end (friends win by default when impostor leaves)
            expect(match.phase).toBe("game_over");
            // Note: winnerId can be null if no friends have points yet
        });
    });
});
