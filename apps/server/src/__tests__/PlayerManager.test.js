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
        test("should return host for first match (no lastStartingPlayerId)", () => {
            const game = createMockGame();
            game.hostId = "user1";
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user2", "user3"];
            game.currentRound = 1;
            game.lastStartingPlayerId = null; // Primera partida

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            expect(startingPlayer).toBe("user1"); // Host empieza
        });

        test("should rotate to next player on new match", () => {
            const game = createMockGame();
            game.hostId = "user1";
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user2", "user3"];
            game.currentRound = 1;
            game.lastStartingPlayerId = "user1"; // User1 empezó la partida anterior

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            expect(startingPlayer).toBe("user2"); // Rota al siguiente
        });

        test("should wrap around to first player after last", () => {
            const game = createMockGame();
            game.hostId = "user1";
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user2", "user3"];
            game.currentRound = 1;
            game.lastStartingPlayerId = "user3"; // User3 empezó la partida anterior

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            expect(startingPlayer).toBe("user1"); // Wrap-around
        });

        test("should skip disconnected player and advance to next eligible", () => {
            const game = createMockGame();
            game.hostId = "user1";
            game.playerOrder = ["user1", "user2", "user3"];
            game.roundPlayers = ["user1", "user3"]; // user2 se desconectó
            game.currentRound = 1;
            game.lastStartingPlayerId = "user1"; // User1 empezó antes

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            // user2 debería ser el siguiente pero no está, así que salta a user3
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

        test("should handle host disconnection gracefully", () => {
            const game = createMockGame();
            game.hostId = "user2"; // Host cambió a user2
            game.playerOrder = ["user2", "user3"]; // user1 (host original) se fue
            game.roundPlayers = ["user2", "user3"];
            game.currentRound = 1;
            game.lastStartingPlayerId = "user1"; // user1 empezó antes pero ya no está

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            // Debería encontrar al siguiente elegible (user2 o user3)
            expect(["user2", "user3"]).toContain(startingPlayer);
        });

        test("should fallback to first eligible when lastStartingPlayerId not in playerOrder", () => {
            const game = createMockGame();
            game.hostId = "user2";
            game.playerOrder = ["user2", "user3"]; // Nuevo orden sin user1
            game.roundPlayers = ["user2", "user3"];
            game.currentRound = 1;
            game.lastStartingPlayerId = "deletedUser"; // Jugador que ya no existe en ninguna lista

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            // Fallback: debería usar el host (user2) o el primero elegible
            expect(startingPlayer).toBe("user2");
        });

        test("should always return a valid player when eligiblePlayers is not empty", () => {
            const game = createMockGame();
            game.hostId = "hostGone"; // Host que ya no existe
            game.playerOrder = ["user3", "user4"];
            game.roundPlayers = ["user3", "user4"];
            game.currentRound = 1;
            game.lastStartingPlayerId = "someoneGone"; // Alguien que ya no existe

            const startingPlayer = PlayerManager.calculateStartingPlayer(game);

            // Debe devolver ALGÚN jugador válido (nunca undefined ni null si hay elegibles)
            expect(startingPlayer).not.toBeNull();
            expect(["user3", "user4"]).toContain(startingPlayer);
        });
    });
});
