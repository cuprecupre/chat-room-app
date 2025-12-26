const Game = require("../game/Game");
const GameManager = require("../services/gameManager");
const PlayerManager = require("../game/PlayerManager");

// Mock de DB services
const dbService = require("../services/db");
jest.mock("../services/db", () => ({
    saveGame: jest.fn(),
    deleteGameState: jest.fn().mockResolvedValue(true),
    getActiveGames: jest.fn().mockResolvedValue([]),
}));

// Mock de Firestore (admin)
jest.mock("firebase-admin", () => ({
    firestore: () => ({
        collection: () => ({
            doc: () => ({
                set: jest.fn(),
                delete: jest.fn(),
                get: jest.fn(),
            }),
        }),
    }),
}));

describe("Game Session & Migration Flow", () => {
    let gameManager;

    beforeEach(() => {
        gameManager = new GameManager();
        // Reset mocks
        dbService.deleteGameState.mockClear();
    });

    test("Single Session Policy: Joining Game B should remove user from Game A", async () => {
        const user = { uid: "user1", name: "Alice" };

        // 1. User creates Game A
        const gameA = gameManager.createGame(user, {});
        expect(gameA.players).toHaveLength(1);
        expect(gameManager.findUserGame("user1")).toBe(gameA);

        // 2. User creates/joins Game B
        // Simulating the cleanup call that happens in socket handlers
        await gameManager.cleanupUserPreviousGames("user1");
        const gameB = gameManager.createGame(user, {}); // This would fail in real socket handler if cleanup wasn't called, but here createGame is dumb.

        // Verification: User should NOT be in Game A anymore
        const userInGameA = gameA.players.find(p => p.uid === "user1");
        expect(userInGameA).toBeUndefined();

        // Game A should be empty (and likely scheduled for cleanup)
        expect(gameA.players).toHaveLength(0);

        // User should be in Game B
        expect(gameB.players).toHaveLength(1);
        expect(gameManager.findUserGame("user1")).toBe(gameB);
    });

    test("Migration: Should move ALL players and delete old game", async () => {
        const host = { uid: "host1", name: "Host" };
        const p2 = { uid: "p2", name: "P2" };
        const p3 = { uid: "p3", name: "P3" };

        // 1. Setup Old Game (Mocked as v1)
        const oldGame = new Game(host, {});
        oldGame.gameId = "OLDGAME";
        oldGame.schemaVersion = 1;
        oldGame.phase = "needs_migration";
        oldGame.addPlayer(p2);
        oldGame.addPlayer(p3);

        // Inject into manager
        gameManager.games["OLDGAME"] = oldGame;

        expect(oldGame.players).toHaveLength(3);

        // 2. Simulate Migration Process (logic copied from socketHandlers)

        // Cleanup Host
        await gameManager.cleanupUserPreviousGames(host.uid, "OLDGAME");

        // Create New Game
        const newGame = gameManager.createGame(host, { showImpostorHint: true });

        // Move Host
        // (Socket join logic omitted, we care about data consistency)

        // Move Other Players
        const otherPlayers = oldGame.players.filter(p => p.uid !== host.uid);
        for (const player of otherPlayers) {
            await gameManager.cleanupUserPreviousGames(player.uid, "OLDGAME");
            newGame.addPlayer(player);
        }

        // Delete Old Game Logic
        delete gameManager.games["OLDGAME"];
        await dbService.deleteGameState("OLDGAME");

        // 3. Verifications

        // New game should have all 3 players
        expect(newGame.players).toHaveLength(3);
        expect(newGame.players.map(p => p.uid)).toEqual(expect.arrayContaining(["host1", "p2", "p3"]));

        // Old game should be gone from manager
        expect(gameManager.getGame("OLDGAME")).toBeUndefined();

        // Delete command should have been called
        expect(dbService.deleteGameState).toHaveBeenCalledWith("OLDGAME");

        // Users should map to New Game
        expect(gameManager.findUserGame("host1").gameId).toBe(newGame.gameId);
        expect(gameManager.findUserGame("p2").gameId).toBe(newGame.gameId);
        expect(gameManager.findUserGame("p3").gameId).toBe(newGame.gameId);
    });

    test("Complex Scenario: User in multiple games (Ghost Busting)", async () => {
        const user = { uid: "ghostUser", name: "Casper" };

        // Create 3 games and force-add user to all (simulating DB corruption)
        const g1 = gameManager.createGame({ uid: "other1", name: "O1" }, {});
        const g2 = gameManager.createGame({ uid: "other2", name: "O2" }, {});
        const g3 = gameManager.createGame({ uid: "other3", name: "O3" }, {});

        g1.addPlayer(user);
        g2.addPlayer(user);
        g3.addPlayer(user);

        // User is technically in 3 games + their own potentially
        // Let's say they want to join a 4th game
        const targetGame = gameManager.createGame({ uid: "host4", name: "H4" }, {});

        // RUN CLEANUP excluding targetGame
        await gameManager.cleanupUserPreviousGames(user.uid, targetGame.gameId);

        // User should be removed from g1, g2, g3
        expect(g1.players.some(p => p.uid === user.uid)).toBe(false);
        expect(g2.players.some(p => p.uid === user.uid)).toBe(false);
        expect(g3.players.some(p => p.uid === user.uid)).toBe(false);

        // Now add to target
        targetGame.addPlayer(user);
        expect(targetGame.players.some(p => p.uid === user.uid)).toBe(true);
    });
});
