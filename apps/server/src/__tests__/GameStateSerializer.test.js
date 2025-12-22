const { getStateForPlayer } = require("../game/GameStateSerializer");

describe("GameStateSerializer", () => {
    let mockGame;

    beforeEach(() => {
        mockGame = {
            gameId: "test-game",
            hostId: "user1",
            players: [{ uid: "user1", name: "User 1" }, { uid: "user2", name: "User 2" }],
            playerScores: { user1: 0, user2: 0 },
            roundCount: 1,
            maxRounds: 5,
            targetScore: 20,
            playerOrder: ["user1", "user2"],
            startingPlayerId: "user1",
            phase: "playing",
            roundPlayers: ["user1", "user2"],
            eliminatedInRound: [],
            votes: {},
            lastRoundScores: {},
            formerPlayers: {
                user3: { name: "Leaver", photoURL: null }
            },
            impostorId: "user2",
            secretWord: "Banana",
            secretCategory: "Fruta",
            currentTurn: 1,
            maxTurns: 3,
            lastEliminatedInTurn: null
        };
    });

    it("should NOT include formerPlayers when phase is 'playing'", () => {
        const state = getStateForPlayer(mockGame, "user1");
        expect(state.phase).toBe("playing");
        expect(state.formerPlayers).toBeUndefined();
    });

    it("should include formerPlayers when phase is 'round_result'", () => {
        mockGame.phase = "round_result";
        const state = getStateForPlayer(mockGame, "user1");
        expect(state.phase).toBe("round_result");
        expect(state.formerPlayers).toBeDefined();
        expect(state.formerPlayers.user3).toBeDefined();
    });

    it("should include formerPlayers when phase is 'game_over'", () => {
        mockGame.phase = "game_over";
        mockGame.winner = "user1";
        const state = getStateForPlayer(mockGame, "user1");
        expect(state.phase).toBe("game_over");
        expect(state.formerPlayers).toBeDefined();
    });

    it("should include essential gameplay data in 'playing' phase", () => {
        const state = getStateForPlayer(mockGame, "user1");
        expect(state.phase).toBe("playing");
        expect(state.secretWord).toBe("Banana"); // Friend sees word
        expect(state.currentTurn).toBe(1);
        expect(state.canVote).toBe(true);
    });
});
