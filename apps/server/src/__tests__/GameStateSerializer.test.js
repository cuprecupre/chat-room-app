const { getStateForPlayer } = require("../game/GameStateSerializer");

describe("GameStateSerializer - Eliminated Players", () => {
    let mockGame;

    beforeEach(() => {
        mockGame = {
            gameId: "TEST123",
            hostId: "user1",
            phase: "playing",
            impostorId: "user3",
            players: [
                { uid: "user1", name: "Player 1" },
                { uid: "user2", name: "Player 2" },
                { uid: "user3", name: "Player 3" },
            ],
            roundPlayers: ["user1", "user3"], // user2 was eliminated
            eliminatedPlayers: ["user2"],
            playerScores: { user1: 0, user2: 0, user3: 0 },
            currentRound: 2,
            maxRounds: 3,
            playerOrder: ["user1", "user2", "user3"],
            startingPlayerId: "user1",
            secretWord: "test",
            secretCategory: "category",
            showImpostorHint: true,
            votes: {},
            formerPlayers: {},
            roundHistory: [{ round: 1, eliminated: "user2", tie: false }],
        };
    });

    test("eliminated player should receive phase 'playing', not 'lobby_wait'", () => {
        const state = getStateForPlayer(mockGame, "user2");

        // The eliminated player should stay in playing phase
        expect(state.phase).toBe("playing");
        // NOT lobby_wait
        expect(state.phase).not.toBe("lobby_wait");
    });

    test("eliminated player should have canVote = false", () => {
        const state = getStateForPlayer(mockGame, "user2");

        expect(state.canVote).toBe(false);
    });

    test("eliminated player should receive their role", () => {
        const state = getStateForPlayer(mockGame, "user2");

        // Eliminated player was not the impostor (returns key)
        expect(state.role).toBe("friend");
    });

    test("eliminated player should receive eliminatedPlayers list", () => {
        const state = getStateForPlayer(mockGame, "user2");

        expect(state.eliminatedPlayers).toContain("user2");
    });

    test("eliminated player should receive roundHistory", () => {
        const state = getStateForPlayer(mockGame, "user2");

        expect(state.roundHistory).toBeDefined();
        expect(state.roundHistory.length).toBe(1);
        expect(state.roundHistory[0].eliminated).toBe("user2");
    });

    test("active player in same game should receive phase 'playing'", () => {
        const state = getStateForPlayer(mockGame, "user1");

        expect(state.phase).toBe("playing");
        expect(state.canVote).toBe(true);
    });

    test("player not in round and not eliminated should receive 'lobby_wait'", () => {
        // Add a new player who wasn't part of this round
        mockGame.players.push({ uid: "user4", name: "Player 4" });

        const state = getStateForPlayer(mockGame, "user4");

        expect(state.phase).toBe("lobby_wait");
    });

    test("round_result phase should include roundHistory for eliminated player info", () => {
        mockGame.phase = "round_result";

        const state = getStateForPlayer(mockGame, "user1");

        expect(state.roundHistory).toBeDefined();
        expect(state.roundHistory[0].eliminated).toBe("user2");
    });
});
