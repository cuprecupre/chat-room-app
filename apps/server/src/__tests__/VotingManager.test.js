/**
 * Tests for VotingManager
 */

const VotingManager = require("../game/VotingManager");

// Mock RoundManager to prevent circular dependency issues
jest.mock("../game/RoundManager", () => ({
    endRound: jest.fn(),
    startNextTurn: jest.fn(),
}));

const { endRound, startNextTurn } = require("../game/RoundManager");

// Helper to create a mock game object
function createMockGame() {
    return {
        gameId: "TEST1",
        phase: "playing",
        players: [
            { uid: "user1", name: "Player 1" },
            { uid: "user2", name: "Player 2" },
            { uid: "user3", name: "Player 3" },
        ],
        roundPlayers: ["user1", "user2", "user3"],
        eliminatedInRound: [],
        votes: {},
        currentTurn: 1,
        maxTurns: 3,
        turnHistory: [],
        impostorId: "user1",
        lastEliminatedInTurn: null,
    };
}

describe("VotingManager", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("castVote", () => {
        test("should register a vote", () => {
            const game = createMockGame();

            VotingManager.castVote(game, "user2", "user1");

            expect(game.votes["user2"]).toBe("user1");
        });

        test("should allow changing vote", () => {
            const game = createMockGame();
            game.votes["user2"] = "user1";

            VotingManager.castVote(game, "user2", "user3");

            expect(game.votes["user2"]).toBe("user3");
        });

        test("should allow unmarking vote with null", () => {
            const game = createMockGame();
            game.votes["user2"] = "user1";

            VotingManager.castVote(game, "user2", null);

            expect(game.votes["user2"]).toBeUndefined();
        });

        test("should throw when game is not in playing phase", () => {
            const game = createMockGame();
            game.phase = "lobby";

            expect(() => {
                VotingManager.castVote(game, "user2", "user1");
            }).toThrow("Solo puedes votar durante una ronda activa.");
        });

        test("should throw when voter is eliminated", () => {
            const game = createMockGame();
            game.eliminatedInRound = ["user2"];

            expect(() => {
                VotingManager.castVote(game, "user2", "user1");
            }).toThrow("Los jugadores eliminados no pueden votar.");
        });

        test("should throw when voter is not in round", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1", "user3"]; // user2 not in round

            expect(() => {
                VotingManager.castVote(game, "user2", "user1");
            }).toThrow("No estás participando en esta ronda.");
        });

        test("should throw when voting for self", () => {
            const game = createMockGame();

            expect(() => {
                VotingManager.castVote(game, "user2", "user2");
            }).toThrow("No puedes votarte a ti mismo.");
        });

        test("should throw when voting for eliminated player", () => {
            const game = createMockGame();
            game.eliminatedInRound = ["user1"];

            expect(() => {
                VotingManager.castVote(game, "user2", "user1");
            }).toThrow("No puedes votar a un jugador eliminado.");
        });

        test("should throw when target is not in round", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1", "user2"]; // user3 not in round

            expect(() => {
                VotingManager.castVote(game, "user2", "user3");
            }).toThrow("Ese jugador no está en esta ronda.");
        });
    });

    describe("hasVoted", () => {
        test("should return true when player has voted", () => {
            const game = createMockGame();
            game.votes["user1"] = "user2";

            expect(VotingManager.hasVoted(game, "user1")).toBe(true);
        });

        test("should return false when player has not voted", () => {
            const game = createMockGame();

            expect(VotingManager.hasVoted(game, "user1")).toBe(false);
        });
    });

    describe("checkIfAllVoted", () => {
        test("should not process when not all have voted", () => {
            const game = createMockGame();
            game.votes["user2"] = "user1";
            // user3 hasn't voted yet

            VotingManager.checkIfAllVoted(game);

            expect(endRound).not.toHaveBeenCalled();
            expect(startNextTurn).not.toHaveBeenCalled();
        });

        test("should process when all active players have voted", () => {
            const game = createMockGame();
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user1";
            game.votes["user3"] = "user1";

            VotingManager.checkIfAllVoted(game);

            // Either endRound or startNextTurn should be called
            expect(endRound.mock.calls.length + startNextTurn.mock.calls.length).toBeGreaterThan(0);
        });
    });

    describe("processVotingResults (via checkIfAllVoted)", () => {
        test("should eliminate player with most votes", () => {
            const game = createMockGame();
            // All vote for user1 (the impostor)
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user1";
            game.votes["user3"] = "user1";

            VotingManager.checkIfAllVoted(game);

            expect(game.eliminatedInRound).toContain("user1");
        });

        test("should end round when impostor is eliminated", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            // Majority votes for impostor
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user1";
            game.votes["user3"] = "user1";

            VotingManager.checkIfAllVoted(game);

            expect(endRound).toHaveBeenCalledWith(game, true); // friendsWon = true
        });

        test("should start next turn when non-impostor is eliminated and 3+ players remain", () => {
            const game = createMockGame();
            // Add a 4th player so that after elimination, 3 remain (not just 2)
            game.players.push({ uid: "user4", name: "Player 4" });
            game.roundPlayers = ["user1", "user2", "user3", "user4"];
            game.impostorId = "user1";
            // Majority votes for user2 (not impostor)
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user3";
            game.votes["user3"] = "user2";
            game.votes["user4"] = "user2";

            VotingManager.checkIfAllVoted(game);

            expect(game.eliminatedInRound).toContain("user2");
            // After user2 eliminated, 3 players remain: user1, user3, user4
            // So startNextTurn should be called, not endRound
            expect(startNextTurn).toHaveBeenCalled();
        });

        test("should handle tie - no elimination, next turn", () => {
            const game = createMockGame();
            game.currentTurn = 1;
            // user2 and user3 get 1 vote each (tie)
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user3";
            game.votes["user3"] = "user1"; // 3-way split

            VotingManager.checkIfAllVoted(game);

            // On tie, should start next turn with wasTie = true
            expect(startNextTurn).toHaveBeenCalledWith(game, true);
        });

        test("should end round on turn 3 tie - impostor wins", () => {
            const game = createMockGame();
            game.currentTurn = 3;
            game.maxTurns = 3;
            // Tie vote
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user3";
            game.votes["user3"] = "user1";

            VotingManager.checkIfAllVoted(game);

            expect(endRound).toHaveBeenCalledWith(game, false); // friendsWon = false
        });

        test("should end round when only 2 players left after elimination", () => {
            const game = createMockGame();
            game.impostorId = "user1";
            game.eliminatedInRound = []; // Start with no eliminations
            // Majority votes for user2
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user3";
            game.votes["user3"] = "user2";

            VotingManager.checkIfAllVoted(game);

            // After user2 is eliminated, only user1 and user3 remain
            // Impostor wins automatically
            expect(endRound).toHaveBeenCalledWith(game, false);
        });

        test("should save vote history", () => {
            const game = createMockGame();
            game.votes["user1"] = "user2";
            game.votes["user2"] = "user1";
            game.votes["user3"] = "user1";

            VotingManager.checkIfAllVoted(game);

            expect(game.turnHistory).toHaveLength(1);
            expect(game.turnHistory[0].turn).toBe(1);
            expect(game.turnHistory[0].votes).toEqual({
                user1: "user2",
                user2: "user1",
                user3: "user1",
            });
        });
    });
});
