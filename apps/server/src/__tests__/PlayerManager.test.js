/**
 * Tests for PlayerManager
 */

const PlayerManager = require("../game/PlayerManager");

// Helper to create a mock match object
function createMockMatch() {
    return {
        matchId: "TEST1",
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
            const match = createMockMatch();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(match, user);

            expect(match.players).toHaveLength(1);
            expect(match.players[0].uid).toBe("user1");
            expect(match.players[0].name).toBe("Player 1");
            expect(match.players[0].photoURL).toBe("https://example.com/user1.jpg");
        });

        test("should initialize player score to 0", () => {
            const match = createMockMatch();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(match, user);

            expect(match.playerScores["user1"]).toBe(0);
        });

        test("should save player to formerPlayers", () => {
            const match = createMockMatch();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(match, user);

            expect(match.formerPlayers["user1"]).toEqual({
                name: "Player 1",
                photoURL: "https://example.com/user1.jpg",
            });
        });

        test("should update player order after adding", () => {
            const match = createMockMatch();

            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(match, createMockUser("user2", "Player 2"));

            expect(match.playerOrder).toContain("user1");
            expect(match.playerOrder).toContain("user2");
        });

        test("should not add duplicate player", () => {
            const match = createMockMatch();
            const user = createMockUser("user1", "Player 1");

            PlayerManager.addPlayer(match, user);
            PlayerManager.addPlayer(match, user);

            expect(match.players).toHaveLength(1);
        });

        test("should handle null photoURL", () => {
            const match = createMockMatch();
            const user = { uid: "user1", name: "Player 1", photoURL: null };

            PlayerManager.addPlayer(match, user);

            expect(match.players[0].photoURL).toBeNull();
        });
    });

    describe("removePlayer", () => {
        test("should remove a player from the game", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(match, createMockUser("user2", "Player 2"));

            PlayerManager.removePlayer(match, "user1");

            expect(match.players).toHaveLength(1);
            expect(match.players[0].uid).toBe("user2");
        });

        test("should save player data to formerPlayers before removing", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));

            PlayerManager.removePlayer(match, "user1");

            expect(match.formerPlayers["user1"]).toEqual({
                name: "Player 1",
                photoURL: "https://example.com/user1.jpg",
            });
        });

        test("should remove player from roundPlayers", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            match.roundPlayers = ["user1"];

            PlayerManager.removePlayer(match, "user1");

            expect(match.roundPlayers).not.toContain("user1");
        });

        test("should remove player from eliminatedPlayers", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            match.eliminatedPlayers = ["user1"];

            PlayerManager.removePlayer(match, "user1");

            expect(match.eliminatedPlayers).not.toContain("user1");
        });

        test("should delete player votes", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            match.votes["user1"] = "user2";

            PlayerManager.removePlayer(match, "user1");

            expect(match.votes["user1"]).toBeUndefined();
        });

        test("should transfer host when host leaves", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(match, createMockUser("user2", "Player 2"));
            match.hostId = "user1";

            const { newHostInfo } = PlayerManager.removePlayer(match, "user1");

            expect(match.hostId).toBe("user2");
            expect(newHostInfo).toEqual({
                uid: "user2",
                name: "Player 2",
            });
        });

        test("should not transfer host when non-host leaves", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(match, createMockUser("user2", "Player 2"));
            match.hostId = "user1";

            const { newHostInfo } = PlayerManager.removePlayer(match, "user2");

            expect(match.hostId).toBe("user1");
            expect(newHostInfo).toBeNull();
        });

        test("should end round when impostor leaves during play", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(match, createMockUser("user2", "Player 2"));
            match.phase = "playing";
            match.impostorId = "user1";

            const { playerIsImpostor } = PlayerManager.removePlayer(match, "user1");

            expect(playerIsImpostor).toBe(true);
            // When impostor leaves, friends win immediately (game_over)
            expect(match.phase).toBe("game_over");
        });

        test("should not end round when non-impostor leaves during play", () => {
            const match = createMockMatch();
            PlayerManager.addPlayer(match, createMockUser("user1", "Player 1"));
            PlayerManager.addPlayer(match, createMockUser("user2", "Player 2"));
            match.phase = "playing";
            match.impostorId = "user2";
            match.roundPlayers = ["user1", "user2"];

            const { playerIsImpostor } = PlayerManager.removePlayer(match, "user1");

            expect(playerIsImpostor).toBe(false);
            expect(match.phase).toBe("playing");
        });
    });

    describe("getActivePlayers", () => {
        test("should return players not eliminated", () => {
            const match = createMockMatch();
            match.roundPlayers = ["user1", "user2", "user3"];
            match.eliminatedPlayers = ["user2"];

            const active = PlayerManager.getActivePlayers(match);

            expect(active).toEqual(["user1", "user3"]);
        });

        test("should return all players when none eliminated", () => {
            const match = createMockMatch();
            match.roundPlayers = ["user1", "user2", "user3"];
            match.eliminatedPlayers = [];

            const active = PlayerManager.getActivePlayers(match);

            expect(active).toEqual(["user1", "user2", "user3"]);
        });

        test("should return empty array when all eliminated", () => {
            const match = createMockMatch();
            match.roundPlayers = ["user1"];
            match.eliminatedPlayers = ["user1"];

            const active = PlayerManager.getActivePlayers(match);

            expect(active).toEqual([]);
        });
    });

    describe("calculateStartingPlayer", () => {
        test("should return host for first match (no lastStartingPlayerId)", () => {
            const match = createMockMatch();
            match.hostId = "user1";
            match.playerOrder = ["user1", "user2", "user3"];
            match.roundPlayers = ["user1", "user2", "user3"];
            match.currentRound = 1;
            match.lastStartingPlayerId = null; // Primera partida

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            expect(startingPlayer).toBe("user1"); // Host empieza
        });

        test("should rotate to next player on new match", () => {
            const match = createMockMatch();
            match.hostId = "user1";
            match.playerOrder = ["user1", "user2", "user3"];
            match.roundPlayers = ["user1", "user2", "user3"];
            match.currentRound = 1;
            match.lastStartingPlayerId = "user1"; // User1 empezó la partida anterior

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            expect(startingPlayer).toBe("user2"); // Rota al siguiente
        });

        test("should wrap around to first player after last", () => {
            const match = createMockMatch();
            match.hostId = "user1";
            match.playerOrder = ["user1", "user2", "user3"];
            match.roundPlayers = ["user1", "user2", "user3"];
            match.currentRound = 1;
            match.lastStartingPlayerId = "user3"; // User3 empezó la partida anterior

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            expect(startingPlayer).toBe("user1"); // Wrap-around
        });

        test("should skip disconnected player and advance to next eligible", () => {
            const match = createMockMatch();
            match.hostId = "user1";
            match.playerOrder = ["user1", "user2", "user3"];
            match.roundPlayers = ["user1", "user3"]; // user2 se desconectó
            match.currentRound = 1;
            match.lastStartingPlayerId = "user1"; // User1 empezó antes

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            // user2 debería ser el siguiente pero no está, así que salta a user3
            expect(startingPlayer).toBe("user3");
        });

        test("should return null when no eligible players", () => {
            const match = createMockMatch();
            match.playerOrder = ["user1", "user2"];
            match.roundPlayers = [];
            match.currentRound = 1;

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            expect(startingPlayer).toBeNull();
        });

        test("should handle host disconnection gracefully", () => {
            const match = createMockMatch();
            match.hostId = "user2"; // Host cambió a user2
            match.playerOrder = ["user2", "user3"]; // user1 (host original) se fue
            match.roundPlayers = ["user2", "user3"];
            match.currentRound = 1;
            match.lastStartingPlayerId = "user1"; // user1 empezó antes pero ya no está

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            // Debería encontrar al siguiente elegible (user2 o user3)
            expect(["user2", "user3"]).toContain(startingPlayer);
        });

        test("should fallback to first eligible when lastStartingPlayerId not in playerOrder", () => {
            const match = createMockMatch();
            match.hostId = "user2";
            match.playerOrder = ["user2", "user3"]; // Nuevo orden sin user1
            match.roundPlayers = ["user2", "user3"];
            match.currentRound = 1;
            match.lastStartingPlayerId = "deletedUser"; // Jugador que ya no existe en ninguna lista

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            // Fallback: debería usar el host (user2) o el primero elegible
            expect(startingPlayer).toBe("user2");
        });

        test("should always return a valid player when eligiblePlayers is not empty", () => {
            const match = createMockMatch();
            match.hostId = "hostGone"; // Host que ya no existe
            match.playerOrder = ["user3", "user4"];
            match.roundPlayers = ["user3", "user4"];
            match.currentRound = 1;
            match.lastStartingPlayerId = "someoneGone"; // Alguien que ya no existe

            const startingPlayer = PlayerManager.calculateStartingPlayer(match);

            // Debe devolver ALGÚN jugador válido (nunca undefined ni null si hay elegibles)
            expect(startingPlayer).not.toBeNull();
            expect(["user3", "user4"]).toContain(startingPlayer);
        });
    });
});
