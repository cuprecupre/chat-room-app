/**
 * Tests for VotingManager - New System
 * 
 * New system:
 * - Ties: impostor gets points
 * - Sudden death: if 2 players left, impostor wins
 * - No "turns" within rounds
 */

const VotingManager = require("../game/VotingManager");
const RoundManager = require("../game/RoundManager");

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
        playerScores: { user1: 0, user2: 0, user3: 0, user4: 0 },
        lastRoundScores: {},
        currentRound: 1,
        maxRounds: 3,
        votes: {},
        phase: "playing",
        roundHistory: [],
        winnerId: null,
        persist: jest.fn(),
    };
}

describe("VotingManager - New System", () => {
    describe("castVote", () => {
        test("should register a vote", () => {
            const game = createMockGame();

            VotingManager.castVote(game, "user2", "user1");

            expect(game.votes["user2"]).toBe("user1");
        });

        test("should allow changing a vote", () => {
            const game = createMockGame();
            game.votes["user2"] = "user3";

            VotingManager.castVote(game, "user2", "user1");

            expect(game.votes["user2"]).toBe("user1");
        });

        test("should allow unvoting with null", () => {
            const game = createMockGame();
            game.votes["user2"] = "user1";

            VotingManager.castVote(game, "user2", null);

            expect(game.votes["user2"]).toBeUndefined();
        });

        test("should throw if voting for yourself", () => {
            const game = createMockGame();

            expect(() => {
                VotingManager.castVote(game, "user2", "user2");
            }).toThrow("No puedes votarte a ti mismo");
        });

        test("should throw if not playing phase", () => {
            const game = createMockGame();
            game.phase = "lobby";

            expect(() => {
                VotingManager.castVote(game, "user2", "user1");
            }).toThrow("Solo puedes votar durante una ronda activa");
        });

        test("should throw if voting for eliminated player", () => {
            const game = createMockGame();
            game.eliminatedPlayers = ["user1"];

            expect(() => {
                VotingManager.castVote(game, "user2", "user1");
            }).toThrow("No puedes votar a un jugador eliminado");
        });
    });

    describe("processVotingResults - Impostor Caught", () => {
        test("should end game when impostor is caught", () => {
            const game = createMockGame();
            game.votes = {
                user1: "user2",
                user2: "user1",
                user3: "user1",
                user4: "user1",
            };

            VotingManager.processVotingResults(game);

            expect(game.phase).toBe("game_over");
            expect(game.winnerId).not.toBe("user1"); // Impostor didn't win
        });
    });

    describe("processVotingResults - Friend Eliminated", () => {
        test("should eliminate friend and end round (impostor survives)", () => {
            const game = createMockGame();
            game.votes = {
                user1: "user2",
                user2: "user3",
                user3: "user2",
                user4: "user2",
            };

            VotingManager.processVotingResults(game);

            expect(game.eliminatedPlayers).toContain("user2");
        });
    });

    describe("processVotingResults - Tie", () => {
        test("should give impostor points on tie", () => {
            const game = createMockGame();
            game.currentRound = 1;
            game.votes = {
                user1: "user2",
                user2: "user1",
                user3: "user4",
                user4: "user3",
            };

            VotingManager.processVotingResults(game);

            // Impostor should have gotten R1 points (3)
            expect(game.playerScores["user1"]).toBe(3);
        });

        test("should continue to next round on tie (not last round)", () => {
            const game = createMockGame();
            game.currentRound = 1;
            game.votes = {
                user1: "user2",
                user2: "user1",
                user3: "user4",
                user4: "user3",
            };

            VotingManager.processVotingResults(game);

            expect(game.phase).toBe("round_result");
        });

        test("should end game on tie in last round (impostor wins)", () => {
            const game = createMockGame();
            game.currentRound = 3;
            game.maxRounds = 3;
            game.votes = {
                user1: "user2",
                user2: "user1",
                user3: "user4",
                user4: "user3",
            };

            VotingManager.processVotingResults(game);

            expect(game.phase).toBe("game_over");
            expect(game.winnerId).toBe("user1");
        });
    });

    describe("processVotingResults - Sudden Death", () => {
        test("should trigger sudden death when only 2 players left", () => {
            const game = createMockGame();
            game.players = [
                { uid: "user1", name: "Player 1" },
                { uid: "user2", name: "Player 2" },
                { uid: "user3", name: "Player 3" },
            ];
            game.roundPlayers = ["user1", "user2", "user3"];
            game.impostorId = "user1";
            game.votes = {
                user1: "user2",
                user2: "user3",
                user3: "user2",
            };

            VotingManager.processVotingResults(game);

            // user2 eliminated, only user1 (impostor) and user3 left
            expect(game.phase).toBe("game_over");
            expect(game.winnerId).toBe("user1");
            expect(game.playerScores["user1"]).toBe(7); // Max points
        });
    });

    describe("hasVoted", () => {
        test("should return true if player has voted", () => {
            const game = createMockGame();
            game.votes["user2"] = "user1";

            expect(VotingManager.hasVoted(game, "user2")).toBe(true);
        });

        test("should return false if player has not voted", () => {
            const game = createMockGame();

            expect(VotingManager.hasVoted(game, "user2")).toBe(false);
        });
    });
});
