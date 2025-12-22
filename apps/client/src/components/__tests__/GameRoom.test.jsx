import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GameRoom } from "../GameRoom";

// Mock child components to isolate GameRoom logic
vi.mock("../ui/Avatar", () => ({
    Avatar: ({ displayName }) => <div data-testid="avatar">{displayName}</div>,
}));

vi.mock("../ui/GameStepper", () => ({
    GameStepper: () => <div data-testid="game-stepper">Stepper</div>,
}));

vi.mock("../ui/Modal", () => ({
    Modal: ({ children, isOpen, title }) => (
        isOpen ? <div data-testid="modal"><h1>{title}</h1>{children}</div> : null
    ),
}));

describe("GameRoom Bandwidth Optimization Integration", () => {
    const mockUser = { uid: "user1", name: "Me" };

    // "Slim" State simulating the optimize payload (no formerPlayers)
    const slimPlayState = {
        phase: "playing",
        gameId: "test-game",
        hostId: "user1",
        players: [
            { uid: "user1", name: "Me", photoURL: "u1.jpg" },
            { uid: "user2", name: "Other", photoURL: "u2.jpg" }
        ],
        playerScores: { user1: 0, user2: 0 },
        lastRoundScores: {},
        role: "amigo",
        secretWord: "Apple",
        currentTurn: 1,
        maxTurns: 3,
        roundCount: 1,
        maxRounds: 5,
        votedPlayers: [],
        eliminatedInRound: [],
        activePlayers: ["user1", "user2"],
        canVote: true,
        // CRITICAL: formerPlayers is UNDEFINED here
        formerPlayers: undefined
    };

    const mockHandlers = {
        onStartGame: vi.fn(),
        onEndGame: vi.fn(),
        onPlayAgain: vi.fn(),
        onLeaveGame: vi.fn(),
        onCopyLink: vi.fn(),
        onCopyGameCode: vi.fn(),
        onVote: vi.fn(),
    };

    it("should render 'playing' phase correctly without formerPlayers in state", () => {
        // This test confirms that removing formerPlayers from the payload 
        // does not cause a crash or render error in the main game view
        render(
            <GameRoom
                state={slimPlayState}
                user={mockUser}
                isHost={true}
                {...mockHandlers}
            />
        );

        // Verify player list still renders
        // Note: Avatar mock renders "Me", PlayerList text renders "Me (Tú)"
        expect(screen.getByText("Me (Tú)")).toBeDefined();
        // "Other" is in both Avatar and List Text, so we use getAllByText
        expect(screen.getAllByText("Other").length).toBeGreaterThan(0);

        // Verify crucial game elements
        expect(screen.getByText("Stepper")).toBeDefined();
    });

    it("should render 'game_over' phase correctly WITH formerPlayers", () => {
        // This test simulates the game_over state where we DO expect formerPlayers
        const gameOverState = {
            ...slimPlayState,
            phase: "game_over",
            winner: "user1",
            playerScores: { user1: 10, user2: 5, user3: 2 },
            // Disconnected player who scored points
            formerPlayers: {
                user3: { name: "Leaver", photoURL: null }
            }
        };

        render(
            <GameRoom
                state={gameOverState}
                user={mockUser}
                isHost={true}
                {...mockHandlers}
            />
        );

        // Should see the winner (Avatar + Name text = multiple elements with "Me")
        expect(screen.getAllByText("Me").length).toBeGreaterThan(0);

        // Should handle the former player in the results list logic
        // We verify that 'Leaver' is rendered in the final list.
        expect(screen.getAllByText("Leaver").length).toBeGreaterThan(0);
    });
});
