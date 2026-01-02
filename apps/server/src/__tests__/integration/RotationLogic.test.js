const RoundManager = require("../../game/RoundManager");
const PlayerManager = require("../../game/PlayerManager");

function createMockGame() {
    return {
        gameId: "TEST_ROTATION",
        players: [
            { uid: "u1", name: "Laura", joinedAt: 100 },
            { uid: "u2", name: "Juan", joinedAt: 200 },
            { uid: "u3", name: "Leandro", joinedAt: 300 },
            { uid: "u4", name: "Javier", joinedAt: 400 },
        ],
        playerScores: {},
        phase: "lobby",
        currentRound: 0,
        maxRounds: 3,
        impostorId: "",
        impostorHistory: [],
        eliminatedPlayers: [],
        votes: {},
        lastRoundScores: {},
        roundPlayers: [],
        roundHistory: [],
        playerBonus: {},
        correctVotesPerPlayer: {},
        playerOrder: ["u1", "u2", "u3", "u4"],
        formerPlayers: {},
        winnerId: null,
        persistAnalytics: jest.fn(),
        lastStartingPlayerId: null,
        hostId: "u1",
        showImpostorHint: true
    };
}

describe("Rotation Logic Integration", () => {
    test("should rotate to next eligible player after substitute starter finishes game in Sudden Death", () => {
        const game = createMockGame();

        // 1. Start Game 1
        // Force u1 (Laura) as starting player for Game 1
        // Because lastStartingPlayerId is null, calculateStartingPlayer should pick host (u1)
        RoundManager.startNewMatch(game);

        expect(game.startingPlayerId).toBe("u1");
        expect(game.lastStartingPlayerId).toBe("u1");
        expect(game.originalStartingPlayerId).toBe("u1");

        // 2. Round 1 ends. u1 (Laura) is eliminated.
        game.eliminatedPlayers.push("u1");

        // 3. Round 2 starts.
        // startNextRound should detect u1 is missing and assign u2 (Juan) as starter
        game.phase = "round_result";
        RoundManager.startNextRound(game);

        expect(game.startingPlayerId).toBe("u2");
        // This is key: lastStartingPlayerId should be updated to u2
        expect(game.lastStartingPlayerId).toBe("u2");

        // 4. Game ends in Sudden Death (e.g. only u2 and u3 remain)
        // Assume u4 was eliminated or something, ensuring sudden death condition
        game.roundPlayers = ["u2", "u3"]; // Only 2 players left

        RoundManager.handleSuddenDeath(game);

        // CHECKPOINT: What is lastStartingPlayerId after sudden death?
        // Current Bug: It reverts to "u1" (Laura)
        // Expected Fix: It remains "u2" (Juan)

        // 5. Start Game 2 (Play Again)
        RoundManager.startNewMatch(game);

        // 6. Verify Starting Player for Game 2
        // Rule 3 (Clarified): Substitute (u2) is the new reference. 
        // Rotation proceeds from u2 -> u3.
        expect(game.startingPlayerId).toBe("u3");
    });

    test("should rotate to NEXT player (skipping substitute) if game ends normally after substitution", () => {
        const game = createMockGame();

        // 1. Start Game 1 (Laura/u1 starts)
        RoundManager.startNewMatch(game);
        expect(game.startingPlayerId).toBe("u1");

        // 2. Round 1 Ends. u1 eliminated.
        game.eliminatedPlayers.push("u1");

        // 3. Round 2 Starts. u2 (Juan) takes over.
        game.phase = "round_result";
        RoundManager.startNextRound(game);
        expect(game.startingPlayerId).toBe("u2");

        // 4. Game Ends Normally (Impostor wins or friend wins, NOT Sudden Death)
        // Simulate end of game state
        game.phase = "game_over";

        // 5. Start Game 2
        RoundManager.startNewMatch(game);

        // 6. Verify Starting Player for Game 2
        // Normal Rotation Rule: Active Starter (u2) -> Change to Next (u3)
        // u2 "used" their turn finishing Game 1.
        expect(game.startingPlayerId).toBe("u3");
    });
});
