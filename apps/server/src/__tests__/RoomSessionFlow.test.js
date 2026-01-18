const Room = require("../Room");
const Match = require("../Match");
const roomManager = require("../services/roomManager");

// Mock de DB services
const dbService = require("../services/db");
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

describe("Room & Match Session Flow", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // Reset state manually since it's a singleton
        roomManager.rooms = {};
        roomManager.pendingDeletions = {};
        roomManager.io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };

        // Reset mocks
        dbService.saveRoom.mockClear();
        dbService.saveMatch.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("Single Session Policy: Joining Room B should remove user from Room A", async () => {
        const user = { uid: "user1", name: "Alice" };

        // 1. User creates Room A
        const roomA = roomManager.createRoom(user, {});
        expect(roomA.players).toHaveLength(1);
        expect(roomManager.findUserRoom("user1")).toBe(roomA);

        // 2. User creates/joins Room B
        // Simulating the cleanup call that happens in socket handlers
        await roomManager.cleanupUserPreviousRooms("user1");
        const roomB = roomManager.createRoom(user, {});

        // Verification: User should NOT be in Room A anymore
        const userInRoomA = roomA.players.find((p) => p.uid === "user1");
        expect(userInRoomA).toBeUndefined();

        // Room A should be empty (and likely scheduled for cleanup)
        expect(roomA.players).toHaveLength(0);

        // User should be in Room B
        expect(roomB.players).toHaveLength(1);
        expect(roomManager.findUserRoom("user1")).toBe(roomB);
    });

    test("Match Flow: Host creating match from room", async () => {
        const host = { uid: "host1", name: "Host" };
        const p2 = { uid: "p2", name: "P2" };
        const p3 = { uid: "p3", name: "P3" };

        const room = roomManager.createRoom(host, {});
        room.addPlayer(p2);
        room.addPlayer(p3);

        expect(room.players).toHaveLength(3);

        // Host starts match
        const match = room.startMatch(host.uid);

        expect(room.phase).toBe("playing");
        expect(room.currentMatch).toBe(match);
        expect(match.players).toHaveLength(3);
        expect(match.roomId).toBe(room.roomId);
    });

    test("Leave Match logic: User returns to lobby but stays in room", async () => {
        const host = { uid: "host1", name: "Host" };
        const p2 = { uid: "p2", name: "P2" };
        const p3 = { uid: "p3", name: "P3" };

        const room = roomManager.createRoom(host, {});
        room.addPlayer(p2);
        room.addPlayer(p3);

        const match = room.startMatch(host.uid);
        expect(match.players).toHaveLength(3);

        // P2 leaves match (returns to lobby)
        room.leaveMatch(p2.uid);

        // P2 should be out of match but in room
        expect(match.players.find(p => p.uid === p2.uid)).toBeUndefined();
        expect(room.players.find(p => p.uid === p2.uid)).toBeDefined();

        const p2InRoom = room.players.find(p => p.uid === p2.uid);
        expect(p2InRoom.isLateJoiner).toBe(true);
        expect(p2InRoom.isPlaying).toBe(false);
    });
});
