const Room = require("../Room");

// Mock de DB services
jest.mock("../services/db", () => ({
    saveGame: jest.fn(),
    saveMatch: jest.fn(),
    saveRoom: jest.fn(),
    updatePlayerStats: jest.fn(),
    getPlayerStats: jest.fn(),
    getMatchState: jest.fn(),
    deleteGameState: jest.fn().mockResolvedValue(true),
    getActiveGames: jest.fn().mockResolvedValue([]),
    initialize: jest.fn(),
}));

describe("Minimum 3 Players Validation", () => {
    const host = { uid: "host1", name: "Host", photoURL: null };
    const p2 = { uid: "p2", name: "Player 2", photoURL: null };
    const p3 = { uid: "p3", name: "Player 3", photoURL: null };

    describe("startMatch validation", () => {
        test("should reject starting match with 1 player", () => {
            const room = new Room(host, {});

            expect(() => {
                room.startMatch(host.uid);
            }).toThrow("Se necesitan al menos 3 jugadores para comenzar.");
        });

        test("should reject starting match with 2 players", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);

            expect(() => {
                room.startMatch(host.uid);
            }).toThrow("Se necesitan al menos 3 jugadores para comenzar.");
        });

        test("should allow starting match with 3 players", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);
            room.addPlayer(p3);

            expect(() => {
                room.startMatch(host.uid);
            }).not.toThrow();

            expect(room.phase).toBe("playing");
            expect(room.currentMatch).toBeDefined();
        });

        test("should allow starting match with more than 3 players", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);
            room.addPlayer(p3);
            room.addPlayer({ uid: "p4", name: "Player 4" });

            expect(() => {
                room.startMatch(host.uid);
            }).not.toThrow();

            expect(room.currentMatch.players).toHaveLength(4);
        });
    });

    describe("playAgain validation", () => {
        test("should reject play again with only 2 players remaining", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);
            room.addPlayer(p3);

            // Start match
            room.startMatch(host.uid);

            // End match
            room.currentMatch.phase = "game_over";
            room.onMatchEnd();

            // Remove one player
            room.removePlayer(p3.uid);

            // Try to play again with only 2 players
            expect(() => {
                room.playAgain(host.uid);
            }).toThrow("Se necesitan al menos 3 jugadores para comenzar una nueva partida.");
        });

        test("should allow play again with 3 or more players", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);
            room.addPlayer(p3);

            // Start match
            room.startMatch(host.uid);

            // End match
            room.currentMatch.phase = "game_over";
            room.onMatchEnd();

            // Play again should work
            expect(() => {
                room.playAgain(host.uid);
            }).not.toThrow();

            expect(room.phase).toBe("playing");
            expect(room.currentMatch).toBeDefined();
        });
    });

    describe("Player abandonment during match", () => {
        test("should end match when player leaves and only 2 remain", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);
            room.addPlayer(p3);

            // Start match
            room.startMatch(host.uid);
            expect(room.phase).toBe("playing");

            // Player 3 leaves (not impostor)
            room.removePlayer(p3.uid);

            // Match should end automatically
            // Phase transitions to game_over when impostor wins by abandonment
            expect(room.currentMatch.phase).toBe("game_over");
            // Only 2 players should remain
            expect(room.currentMatch.players).toHaveLength(2);
        });

        test("should continue match when player leaves and 3+ remain", () => {
            const room = new Room(host, {});
            room.addPlayer(p2);
            room.addPlayer(p3);
            room.addPlayer({ uid: "p4", name: "Player 4" });

            // Start match
            room.startMatch(host.uid);
            expect(room.phase).toBe("playing");

            // Identify who is NOT the impostor
            const impostorId = room.currentMatch.impostorId;
            const nonImpostorId = [host.uid, p2.uid, p3.uid, "p4"].find(id => id !== impostorId);

            // Non-impostor player leaves
            room.removePlayer(nonImpostorId);

            // Match should continue (3 players remain)
            expect(room.currentMatch.players).toHaveLength(3);
            expect(room.phase).toBe("playing");
        });
    });
});
