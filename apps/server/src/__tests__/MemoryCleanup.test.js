const Game = require("../Game");
const PlayerManager = require("../game/PlayerManager");

// Mock de DBService para evitar llamadas reales a Firestore
jest.mock("../services/db", () => ({
    saveGameAnalytics: jest.fn(),
    initialize: jest.fn(),
}));

describe("Memory Cleanup & Limits", () => {
    let game;
    let mockUser;

    beforeEach(() => {
        mockUser = { uid: "host123", name: "Host", photoURL: "http://photo.jpg" };
        game = new Game(mockUser);
    });

    describe("PlayerManager - PhotoURL Truncation", () => {
        test("should accept normal photoURL", () => {
            const user = { uid: "u1", name: "Normal", photoURL: "http://short.url/pic.jpg" };
            PlayerManager.addPlayer(game, user);
            const player = game.players.find((p) => p.uid === "u1");
            expect(player.photoURL).toBe("http://short.url/pic.jpg");
        });

        test("should truncate massive photoURL (e.g. Base64)", () => {
            const massiveURL = "data:image/jpeg;base64," + "A".repeat(1000); // > 500 chars
            const user = { uid: "u2", name: "BigPhoto", photoURL: massiveURL };

            // Spy on console.warn to verify warning
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });

            PlayerManager.addPlayer(game, user);

            const player = game.players.find((p) => p.uid === "u2");
            expect(player.photoURL).toBeNull(); // Should be nulled out
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("too long"));

            warnSpy.mockRestore();
        });
    });

    describe("Game - playAgain Memory Cleanup", () => {
        test("should clear formerPlayers from previous games but keep current players", () => {
            // Setup: Game with players and some ghosts
            const p1 = { uid: "p1", name: "Player 1", photoURL: "url1" };
            const p2 = { uid: "p2", name: "Player 2", photoURL: "url2" };
            const zombie = { uid: "z1", name: "Zombie", photoURL: "url3" };

            // Add active players
            PlayerManager.addPlayer(game, p1);
            PlayerManager.addPlayer(game, p2);

            // Manually add a "ghost" to formerPlayers (simulating someone who left)
            game.formerPlayers[zombie.uid] = zombie;

            expect(game.formerPlayers).toHaveProperty("p1");
            expect(game.formerPlayers).toHaveProperty("p2");
            expect(game.formerPlayers).toHaveProperty("z1"); // The ghost exists

            // Finish game to allow playAgain
            game.endGame(mockUser.uid);

            // ACT: Play Again
            game.playAgain(mockUser.uid);

            // ASSERT: Ghost must be gone, active players remains
            expect(game.formerPlayers).toHaveProperty("p1");
            expect(game.formerPlayers).toHaveProperty("p2");
            expect(game.formerPlayers).not.toHaveProperty("z1"); // GHOST BUSTED! 👻🚫

            // Verify content of surviving players
            expect(game.formerPlayers["p1"].name).toBe("Player 1");
        });
    });
});
