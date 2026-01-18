const RoomManager = require("../services/roomManager");
const sessionManager = require("../services/sessionManager");

/**
 * Delta Updates Test Suite
 * 
 * Tests the bandwidth-optimized delta update methods:
 * - emitPhaseUpdate: Send minimal phase changes
 * - emitPlayerUpdate: Send minimal player list changes
 */

// Mock Socket.IO
const createMockIO = () => {
    const emittedEvents = [];
    return {
        to: jest.fn().mockReturnValue({
            emit: jest.fn((event, data) => {
                emittedEvents.push({ event, data });
            }),
        }),
        emittedEvents,
        getEmittedEvents: () => emittedEvents,
        clearEvents: () => emittedEvents.length = 0,
    };
};

// Mock Room
const createMockRoom = (overrides = {}) => ({
    roomId: "TEST-ROOM",
    hostId: "host1",
    phase: "lobby",
    players: [
        { uid: "host1", name: "Host Player", photoURL: "http://example.com/host.jpg" },
        { uid: "player2", name: "Player 2", photoURL: "http://example.com/p2.jpg" },
        { uid: "player3", name: "Player 3", photoURL: null },
    ],
    currentMatch: null,
    ...overrides,
});

describe("RoomManager Delta Updates", () => {
    let mockIO;
    let originalIO;

    beforeEach(() => {
        mockIO = createMockIO();
        originalIO = RoomManager.io;
        RoomManager.io = mockIO;

        // Mock session manager
        jest.spyOn(sessionManager, "getUserSocket").mockImplementation((uid) => {
            return `socket-${uid}`;
        });
    });

    afterEach(() => {
        RoomManager.io = originalIO;
        jest.restoreAllMocks();
    });

    describe("emitPhaseUpdate", () => {
        test("should emit phase-update to all players", () => {
            const room = createMockRoom({ phase: "playing" });
            room.currentMatch = {
                phase: "voting",
                currentRound: 2,
                maxRounds: 3,
            };

            RoomManager.emitPhaseUpdate(room);

            // Should emit to each player
            expect(mockIO.to).toHaveBeenCalledTimes(3);
            expect(mockIO.to).toHaveBeenCalledWith("socket-host1");
            expect(mockIO.to).toHaveBeenCalledWith("socket-player2");
            expect(mockIO.to).toHaveBeenCalledWith("socket-player3");
        });

        test("should include correct phase data", () => {
            const room = createMockRoom({ phase: "playing" });
            room.currentMatch = {
                phase: "round_result",
                currentRound: 1,
                maxRounds: 3,
            };

            RoomManager.emitPhaseUpdate(room);

            const events = mockIO.getEmittedEvents();
            expect(events[0].event).toBe("phase-update");
            expect(events[0].data).toEqual({
                phase: "playing",
                matchPhase: "round_result",
                currentRound: 1,
                maxRounds: 3,
            });
        });

        test("should handle room without match", () => {
            const room = createMockRoom({ phase: "lobby" });
            room.currentMatch = null;

            RoomManager.emitPhaseUpdate(room);

            const events = mockIO.getEmittedEvents();
            expect(events[0].data).toEqual({
                phase: "lobby",
                matchPhase: null,
                currentRound: null,
                maxRounds: null,
            });
        });

        test("should not emit when IO is not initialized", () => {
            RoomManager.io = null;
            const room = createMockRoom();

            // Should not throw
            expect(() => RoomManager.emitPhaseUpdate(room)).not.toThrow();
        });

        test("should skip players without active socket", () => {
            jest.spyOn(sessionManager, "getUserSocket").mockImplementation((uid) => {
                if (uid === "player2") return null; // Player 2 disconnected
                return `socket-${uid}`;
            });

            const room = createMockRoom();
            RoomManager.emitPhaseUpdate(room);

            // Should only emit to 2 players (host1 and player3)
            expect(mockIO.to).toHaveBeenCalledTimes(2);
            expect(mockIO.to).toHaveBeenCalledWith("socket-host1");
            expect(mockIO.to).toHaveBeenCalledWith("socket-player3");
        });
    });

    describe("emitPlayerUpdate", () => {
        test("should emit player-update with 'joined' action", () => {
            const room = createMockRoom();
            const newPlayer = { uid: "player4", name: "New Player", photoURL: "http://example.com/p4.jpg" };

            RoomManager.emitPlayerUpdate(room, "joined", newPlayer);

            const events = mockIO.getEmittedEvents();
            expect(events[0].event).toBe("player-update");
            expect(events[0].data).toEqual({
                action: "joined",
                player: {
                    uid: "player4",
                    name: "New Player",
                    photoURL: "http://example.com/p4.jpg",
                },
                hostId: "host1",
                playerCount: 3,
            });
        });

        test("should emit player-update with 'left' action", () => {
            const room = createMockRoom();
            room.players = room.players.filter(p => p.uid !== "player2");
            const leftPlayer = { uid: "player2", name: "Player 2", photoURL: "http://example.com/p2.jpg" };

            RoomManager.emitPlayerUpdate(room, "left", leftPlayer);

            const events = mockIO.getEmittedEvents();
            expect(events[0].data.action).toBe("left");
            expect(events[0].data.player.uid).toBe("player2");
            expect(events[0].data.playerCount).toBe(2);
        });

        test("should emit player-update with 'kicked' action", () => {
            const room = createMockRoom();
            room.players = room.players.filter(p => p.uid !== "player3");
            const kickedPlayer = { uid: "player3", name: "Player 3", photoURL: null };

            RoomManager.emitPlayerUpdate(room, "kicked", kickedPlayer);

            const events = mockIO.getEmittedEvents();
            expect(events[0].data.action).toBe("kicked");
            expect(events[0].data.player.uid).toBe("player3");
            expect(events[0].data.player.photoURL).toBeNull();
        });

        test("should include updated hostId when host changes", () => {
            const room = createMockRoom();
            room.hostId = "player2"; // Host changed
            room.players = room.players.filter(p => p.uid !== "host1");
            const leftPlayer = { uid: "host1", name: "Host Player" };

            RoomManager.emitPlayerUpdate(room, "left", leftPlayer);

            const events = mockIO.getEmittedEvents();
            expect(events[0].data.hostId).toBe("player2");
        });

        test("should not emit when IO is not initialized", () => {
            RoomManager.io = null;
            const room = createMockRoom();
            const player = { uid: "test", name: "Test" };

            expect(() => RoomManager.emitPlayerUpdate(room, "joined", player)).not.toThrow();
        });
    });

    describe("Delta payload size comparison", () => {
        test("phase-update should be significantly smaller than full state", () => {
            const room = createMockRoom({ phase: "playing" });
            room.currentMatch = {
                phase: "voting",
                currentRound: 2,
                maxRounds: 3,
                players: room.players,
                votes: {},
                clues: [],
                eliminatedPlayers: [],
                roundPlayers: ["host1", "player2", "player3"],
                roundHistory: [{ round: 1, eliminated: null }],
            };

            RoomManager.emitPhaseUpdate(room);

            const events = mockIO.getEmittedEvents();
            const deltaPayload = JSON.stringify(events[0].data);

            // Delta should be < 200 bytes
            expect(deltaPayload.length).toBeLessThan(200);

            // Full state would be much larger (simulate)
            const fullState = JSON.stringify({
                roomId: room.roomId,
                hostId: room.hostId,
                phase: room.phase,
                players: room.players,
                currentMatch: room.currentMatch,
            });

            // Full state is typically 2-5KB
            expect(fullState.length).toBeGreaterThan(deltaPayload.length * 5);
        });

        test("player-update should be significantly smaller than full state", () => {
            const room = createMockRoom();
            const player = { uid: "player4", name: "New Player", photoURL: "http://example.com/p4.jpg" };

            RoomManager.emitPlayerUpdate(room, "joined", player);

            const events = mockIO.getEmittedEvents();
            const deltaPayload = JSON.stringify(events[0].data);

            // Delta should be < 300 bytes
            expect(deltaPayload.length).toBeLessThan(300);
        });
    });
});
