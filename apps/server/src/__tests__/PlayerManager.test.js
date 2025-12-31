/**
 * Tests for PlayerManager
 */

const PlayerManager = require("../game/PlayerManager");

// Helper to create a mock game object
function createMockGame() {
    return {
        gameId: "TEST1",
        hostId: null,
        players: [],
        playerScores: {},
        formerPlayers: {},
        playerOrder: [],
        roundPlayers: [],
        eliminatedPlayers: [],
        votes: {},
        phase: "lobby",
        winnerId: null,
        persistAnalytics: jest.fn(), // Mock persist method for RoundManager.endRound
    };
}

// Helper to create a mock user
function createMockUser(uid, name) {
    return {
        uid,
        name,
        photoURL: `https://example.com/${uid}.jpg`,
    };
}

describe("PlayerManager", () => {
    describe("addPlayer", () => {
        test("should add a player to the game", () => {
            const game = createMockGame();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(game, user);

            expect(game.players).toHaveLength(1);
            expect(game.players[0].uid).toBe("user1");
            expect(game.players[0].name).toBe("Player 1");
            expect(game.players[0].photoURL).toBe("https://example.com/user1.jpg");
        });

        test("should initialize player score to 0", () => {
            const game = createMockGame();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(game, user);

            expect(game.playerScores["user1"]).toBe(0);
        });

        test("should save player to formerPlayers", () => {
            const game = createMockGame();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(game, user);

            expect(game.formerPlayers["user1"]).toEqual({
                name: "Player 1",
                photoURL: "https://example.com/user1.jpg",
            });
        });

        test("should update player order after adding", () => {
            const game = createMockGame();

            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(game, createMockUser("user2", "Player 2"));

            expect(game.playerOrder).toContain("user1");
            expect(game.playerOrder).toContain("user2");
        });

        test("should not add duplicate player", () => {
            const game = createMockGame();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(game, user);
            PlayerManager.addPlayer(game, user);

            expect(game.players).toHaveLength(1);
        });

        test("should handle null photoURL", () => {
            const game = createMockGame();
            const user = { uid: "user1", name: "Player 1", photoURL: null };

            PlayerManager.addPlayer(game, user);

            expect(game.players[0].photoURL).toBeNull();
        });
    });

    describe("removePlayer", () => {
        test("should remove a player from the game", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(game, createMockUser("user2", "Player 2"));

            PlayerManager.removePlayer(game, "user1");

            expect(game.players).toHaveLength(1);
            expect(game.players[0].uid).toBe("user2");
        });

        test("should save player data to formerPlayers before removing", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));

            PlayerManager.removePlayer(game, "user1");

            expect(game.formerPlayers["user1"]).toEqual({
                name: "Player 1",
                photoURL: "https://example.com/user1.jpg",
            });
        });

        test("should remove player from roundPlayers", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            game.roundPlayers = ["user1"];

            PlayerManager.removePlayer(game, "user1");

            expect(game.roundPlayers).not.toContain("user1");
        });

        test("should remove player from eliminatedPlayers", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            game.eliminatedPlayers = ["user1"];

            PlayerManager.removePlayer(game, "user1");

            expect(game.eliminatedPlayers).not.toContain("user1");
        });

        test("should delete player votes", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            game.votes["user1"] = "user2";

            PlayerManager.removePlayer(game, "user1");

            expect(game.votes["user1"]).toBeUndefined();
        });

        test("should transfer host when host leaves", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(game, createMockUser("user2", "Player 2"));
            game.hostId = "user1";

            const { newHostInfo } = PlayerManager.removePlayer(game, "user1");

            expect(game.hostId).toBe("user2");
            expect(newHostInfo).toEqual({
                uid: "user2",
                name: "Player 2",
            });
        });

        test("should not transfer host when non-host leaves", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(game, createMockUser("user2", "Player 2"));
            game.hostId = "user1";

            const { newHostInfo } = PlayerManager.removePlayer(game, "user2");

            expect(game.hostId).toBe("user1");
            expect(newHostInfo).toBeNull();
        });

        test("should end round when impostor leaves during play", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(game, createMockUser("user2", "Player 2"));
            game.phase = "playing";
            game.impostorId = "user1";

            const { playerIsImpostor } = PlayerManager.removePlayer(game, "user1");

            expect(playerIsImpostor).toBe(true);
            // When impostor leaves, friends win immediately (game_over)
            expect(game.phase).toBe("game_over");
        });

        test("should not end round when non-impostor leaves during play", () => {
            const game = createMockGame();
            PlayerManager.addPlayer(game, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(game, createMockUser("user2", "Player 2"));
            game.phase = "playing";
            game.impostorId = "user2";
            game.roundPlayers = ["user1", "user2"];

            const { playerIsImpostor } = PlayerManager.removePlayer(game, "user1");

            expect(playerIsImpostor).toBe(false);
            expect(game.phase).toBe("playing");
        });
    });

    describe("getActivePlayers", () => {
        test("should return players not eliminated", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1", "user2", "user3"];
            game.eliminatedPlayers = ["user2"];

            const active = PlayerManager.getActivePlayers(game);

            expect(active).toEqual(["user1", "user3"]);
        });

        test("should return all players when none eliminated", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1", "user2", "user3"];
            game.eliminatedPlayers = [];

            const active = PlayerManager.getActivePlayers(game);

            expect(active).toEqual(["user1", "user2", "user3"]);
        });

        test("should return empty array when all eliminated", () => {
            const game = createMockGame();
            game.roundPlayers = ["user1"];
            game.eliminatedPlayers = ["user1"];

            const active = PlayerManager.getActivePlayers(game);

            expect(active).toEqual([]);
        });
    });

    describe("calculateStartingPlayer", () => {
        test("should return first player for round 1", () => {
            const game = createMockGame();
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user2", "user3"];
            game.currentRound = 1;

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            expect(startingPlayer).toBe("user1");
        });

        test("should rotate starting player each round", () => {
            const game = createMockGame();
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user2", "user3"];

            game.currentRound = 1;
            expect(PlayerManager.calculateStartingPlayer(game)).toBe("user1");

            game.currentRound = 2;
            expect(PlayerManager.calculateStartingPlayer(game)).toBe("user2");

            game.currentRound = 3;
            expect(PlayerManager.calculateStartingPlayer(game)).toBe("user3");

            game.currentRound = 4;
            expect(PlayerManager.calculateStartingPlayer(game)).toBe("user1"); // Wrap around
        });

        test("should skip players not in roundPlayers", () => {
            const game = createMockGame();
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user3"]; // user2 not in round
            game.currentRound = 2;

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            // Round 2 would be index 1, which maps to user3 in eligible players
            expect(startingPlayer).toBe("user3");
        });

        test("should return null when no eligible players", () => {
            const game = createMockGame();
            game.playerOrder = ["user1", "user2"];
            game.roundPlayers = [];
            game.currentRound = 1;

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            expect(startingPlayer).toBeNull();
        });
    });
});
