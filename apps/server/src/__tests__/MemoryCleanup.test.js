const Match = require("../Match");
const PlayerManager = require("../game/PlayerManager");

// Mock de DBService para evitar llamadas reales a Firestore
jest.mock("../services/db", () => ({
    saveGame: jest.fn(),
    saveMatch: jest.fn(),
    saveRoom: jest.fn(),
    updatePlayerStats: jest.fn(),
    getPlayerStats: jest.fn(),
    initialize: jest.fn(),
}));

describe("Memory Cleanup & Limits", () => {
    let match;
    let mockUser;

    beforeEach(() => {
        mockUser = { uid: "host123", name: "Host", photoURL: "http://photo.jpg" };
        match = new Match(mockUser);
    });

    describe("PlayerManager - PhotoURL Truncation", () => {
        test("should accept normal photoURL", () => {
            const user = { uid: "u1", name: "Normal", photoURL: "http://short.url/pic.jpg" };
            PlayerManager.addPlayer(match, user);
            const player = match.players.find((p) => p.uid === "u1");
            expect(player.photoURL).toBe("http://short.url/pic.jpg");
        });

        test("should truncate massive photoURL (e.g. Base64)", () => {
            const massiveURL = "data:image/jpeg;base64," + "A".repeat(1000); // > 500 chars
            const user = { uid: "u2", name: "BigPhoto", photoURL: massiveURL };

            // Spy on console.warn to verify warning
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });

            PlayerManager.addPlayer(match, user);

            const player = match.players.find((p) => p.uid === "u2");
            expect(player.photoURL).toBeNull(); // Should be nulled out
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("too long"));

            warnSpy.mockRestore();
        });
    });

    describe("Match - playAgain Memory Cleanup", () => {
        test("should clear formerPlayers from previous matches but keep current players", () => {
            // Setup: Game with players and some ghosts
            const p1 = { uid: "p1", name: "Player 1", photoURL: "url1" };
            const p2 = { uid: "p2", name: "Player 2", photoURL: "url2" };
            const zombie = { uid: "z1", name: "Zombie", photoURL: "url3" };

            // Add active players
            PlayerManager.addPlayer(match, p1);
            PlayerManager.addPlayer(match, p2);

            // Manually add a "ghost" to formerPlayers (simulating someone who left)
            match.formerPlayers[zombie.uid] = zombie;

            expect(match.formerPlayers).toHaveProperty("p1");
            expect(match.formerPlayers).toHaveProperty("p2");
            expect(match.formerPlayers).toHaveProperty("z1"); // The ghost exists

            // Finish match to allow playAgain
            match.endMatch(mockUser.uid);

            // ACT: Play Again
            match.playAgain(mockUser.uid);

            // ASSERT: Ghost must be gone, active players remains
            expect(match.formerPlayers).toHaveProperty("p1");
            expect(match.formerPlayers).toHaveProperty("p2");
            expect(match.formerPlayers).not.toHaveProperty("z1"); // GHOST BUSTED! 👻🚫

            // Verify content of surviving players
            expect(match.formerPlayers["p1"].name).toBe("Player 1");
        });
    });
});
