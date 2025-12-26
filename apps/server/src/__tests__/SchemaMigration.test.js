const Game = require("../Game");

// Mock de DBService para evitar llamadas reales a Firestore
jest.mock("../services/db", () => ({
    saveGameState: jest.fn(),
    initialize: jest.fn(),
}));

describe("Schema Migration", () => {
    let mockUser;

    beforeEach(() => {
        mockUser = { uid: "host123", name: "Host", photoURL: "http://photo.jpg" };
    });

    describe("Game constructor - schemaVersion", () => {
        test("new games should have schemaVersion = 2", () => {
            const game = new Game(mockUser);
            expect(game.schemaVersion).toBe(2);
        });
    });

    describe("Game.fromState - old system detection", () => {
        test("should detect schemaVersion 1 as needs_migration", () => {
            const oldData = {
                hostId: "host123",
                phase: "playing",
                players: [{ uid: "host123", name: "Host" }],
                playerScores: {},
                schemaVersion: 1,  // Old version
                currentRound: 1,
                roundPlayers: ["host123"],
            };

            const game = Game.fromState("TEST1", oldData);

            expect(game.phase).toBe("needs_migration");
            expect(game.migratedFromOldSystem).toBe(true);
        });

        test("should detect missing schemaVersion as needs_migration", () => {
            const oldData = {
                hostId: "host123",
                phase: "playing",
                players: [{ uid: "host123", name: "Host" }],
                playerScores: {},
                // No schemaVersion field
                currentRound: 1,
                roundPlayers: ["host123"],
            };

            const game = Game.fromState("TEST2", oldData);

            expect(game.phase).toBe("needs_migration");
            expect(game.schemaVersion).toBe(1);  // Defaults to 1
        });

        test("should detect old turn-based system as needs_migration", () => {
            const oldData = {
                hostId: "host123",
                phase: "playing",
                players: [{ uid: "host123", name: "Host" }],
                playerScores: {},
                currentTurn: 2,  // Old system used currentTurn
                maxTurns: 3,     // Old system used maxTurns
                // No currentRound
            };

            const game = Game.fromState("TEST3", oldData);

            expect(game.phase).toBe("needs_migration");
        });

        test("should NOT migrate schemaVersion 2 games", () => {
            const newData = {
                hostId: "host123",
                phase: "playing",
                players: [{ uid: "host123", name: "Host" }],
                playerScores: {},
                schemaVersion: 2,  // Current version
                currentRound: 1,
                maxRounds: 3,
                roundPlayers: ["host123"],
            };

            const game = Game.fromState("TEST4", newData);

            expect(game.phase).toBe("playing");  // Not migrated
            expect(game.schemaVersion).toBe(2);
        });

        test("should detect corrupted games (playing without roundPlayers)", () => {
            const corruptedData = {
                hostId: "host123",
                phase: "playing",
                players: [{ uid: "host123", name: "Host" }],
                playerScores: {},
                schemaVersion: 2,
                currentRound: 1,
                roundPlayers: [],  // Empty - corrupted!
            };

            const game = Game.fromState("TEST5", corruptedData);

            expect(game.phase).toBe("needs_migration");
        });

        test("should detect corrupted games (roundPlayers with invalid UIDs)", () => {
            const corruptedData = {
                hostId: "host123",
                phase: "playing",
                players: [{ uid: "host123", name: "Host" }],
                playerScores: {},
                schemaVersion: 2,
                currentRound: 1,
                roundPlayers: ["invalid_uid_123"],  // UID not in players
            };

            const game = Game.fromState("TEST6", corruptedData);

            expect(game.phase).toBe("needs_migration");
        });
    });

    describe("GameStateSerializer - schemaVersion persistence", () => {
        test("getPersistenceState should include schemaVersion", () => {
            const game = new Game(mockUser);
            const state = game.getPersistenceState();

            expect(state.schemaVersion).toBe(2);
        });
    });
});
