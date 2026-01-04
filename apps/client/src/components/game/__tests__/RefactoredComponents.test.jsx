import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock del canvas-confetti, usado en GameOverScreen (y por transitividad podría afectar)
vi.mock("canvas-confetti", () => ({
    default: vi.fn(),
}));

// Mock de imágenes
vi.mock("../../assets/dual-impostor.jpg", () => ({ default: "test-file-stub" }));
vi.mock("../../assets/card.jpg", () => ({ default: "test-file-stub" }));
vi.mock("../../assets/card-back.jpg", () => ({ default: "test-file-stub" }));

// Import componentes
import { HelpLink } from "../HelpLink";
import { SpectatorMode } from "../SpectatorMode";
import { MigrationScreen } from "../MigrationScreen";
import { LobbyScreen } from "../LobbyScreen";
import { GameCard } from "../GameCard";
import { PlayerList } from "../PlayerList";

describe("Refactored Components", () => {
    describe("HelpLink", () => {
        it("renders the help button", () => {
            render(<HelpLink />);
            expect(screen.getByText("¿Cómo jugar?")).toBeInTheDocument();
        });

        it("opens modal on click", () => {
            render(<HelpLink />);
            fireEvent.click(screen.getByText("¿Cómo jugar?"));
            expect(screen.getByText(/Voltea tu carta y descubre si eres/)).toBeInTheDocument();
        });
    });

    describe("SpectatorMode", () => {
        it("renders spectator message", () => {
            render(<SpectatorMode />);
            expect(screen.getByText("Modo Espectador")).toBeInTheDocument();
            expect(screen.getByText(/Has sido eliminado de esta partida/)).toBeInTheDocument();
        });
    });

    describe("MigrationScreen", () => {
        it("renders migration message", () => {
            render(<MigrationScreen isHost={false} />);
            expect(screen.getByText("¡Nueva versión disponible!")).toBeInTheDocument();
            expect(screen.queryByText("Continuar a nueva sala")).not.toBeInTheDocument();
        });

        it("renders continue button for host", () => {
            const onMigrate = vi.fn();
            render(<MigrationScreen isHost={true} onMigrateGame={onMigrate} />);
            const btn = screen.getByText("Continuar a nueva sala");
            expect(btn).toBeInTheDocument();
            fireEvent.click(btn);
            expect(onMigrate).toHaveBeenCalled();
        });
    });

    describe("LobbyScreen", () => {
        const mockState = {
            players: [{ uid: "host1", name: "Host Name" }],
            hostId: "host1"
        };
        const mockUser = { uid: "host1" };

        it("renders host view", () => {
            render(
                <LobbyScreen
                    state={mockState}
                    isHost={true}
                    user={mockUser}
                    onCopyLink={() => { }}
                    onStartGame={() => { }}
                />
            );
            expect(screen.getByText(/Invita a tus amigos/)).toBeInTheDocument();

            // Check for buttons (mobile and desktop versions might both be rendered by JSDOM)
            const buttons = screen.getAllByText("Comenzar partida");
            expect(buttons.length).toBeGreaterThan(0);
            buttons.forEach(btn => expect(btn).toBeDisabled());
        });

        it("renders guest view", () => {
            render(
                <LobbyScreen
                    state={mockState}
                    isHost={false}
                    user={{ uid: "guest1" }}
                    onCopyLink={() => { }}
                    onStartGame={() => { }}
                />
            );
            expect(screen.getByText(/La partida empezará pronto/)).toBeInTheDocument();
            expect(screen.queryByText("Comenzar partida")).not.toBeInTheDocument();
        });
    });

    describe("GameCard", () => {
        const mockStateFriend = {
            role: "friend",
            secretWord: "Manzana"
        };
        const mockStateImpostor = {
            role: "impostor",
            secretCategory: "Frutas"
        };

        it("renders initial state (front)", () => {
            render(<GameCard state={mockStateFriend} />);
            // Buscamos la imagen del frente por su alt text
            expect(screen.getByAltText("Frente de la carta")).toBeInTheDocument();
        });

        it("reveals content on click", async () => {
            render(<GameCard state={mockStateFriend} />);
            const cardInner = screen.getByTitle("Toca para voltear la carta");
            fireEvent.click(cardInner);

            // Verificamos que se muestre el contenido del dorso
            await waitFor(() => {
                expect(screen.getByText("Manzana")).toBeInTheDocument();
            });
        });

        it("shows impostor info correctly", async () => {
            render(<GameCard state={mockStateImpostor} />);
            const cardInner = screen.getByTitle("Toca para voltear la carta");
            fireEvent.click(cardInner);

            await waitFor(() => {
                expect(screen.getByText("Impostor")).toBeInTheDocument();
                expect(screen.getByText("Frutas")).toBeInTheDocument();
            });
        });
    });

    describe("PlayerList", () => {
        const mockPlayers = [
            { uid: "p1", name: "Player 1", photoURL: "url1" },
            { uid: "p2", name: "Player 2", photoURL: "url2" }
        ];

        it("renders list of players", () => {
            render(
                <PlayerList
                    players={mockPlayers}
                    currentUserId="p1"
                    gameState={{}}
                />
            );
            // Regex to handle "Player 1 (Tú)"
            expect(screen.getByText(/Player 1/)).toBeInTheDocument();
            expect(screen.getAllByRole("listitem")).toHaveLength(2);
        });

        it("shows voting buttons during voting phase", () => {
            const votingState = {
                phase: "playing",
                canVote: true,
                activePlayers: ["p1", "p2"],
                eliminatedPlayers: [],
                votedPlayers: []
            };

            render(
                <PlayerList
                    players={mockPlayers}
                    currentUserId="p1"
                    gameState={votingState}
                    onVote={() => { }}
                />
            );

            // Debería ver botón de votar para Player 2 (no para mí mismo)
            const buttons = screen.getAllByText("Votar");
            expect(buttons.length).toBeGreaterThan(0);
        });
    });
});
