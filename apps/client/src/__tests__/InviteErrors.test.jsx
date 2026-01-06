import { render, screen, fireEvent } from "@testing-library/react";
import { GameNotFoundCard } from "../components/InviteErrors";
import { describe, it, expect, vi } from "vitest";

// Mock Button to simplify testing (optional, but good if Button is complex)
// For now we test with real button assuming it renders children and handles click

describe("InviteErrors Components", () => {
    describe("GameNotFoundCard", () => {
        it("renders correct title and subtitle", () => {
            render(<GameNotFoundCard roomId="123" onCancel={() => { }} />);
            expect(screen.getByText("La sala ya no existe")).toBeInTheDocument();
            expect(screen.getByText(/Crea una nueva sala para invitar a tus amigos/i)).toBeInTheDocument();
        });

        it("renders ONLY 'Volver al inicio' when onCreate is missing", () => {
            render(<GameNotFoundCard roomId="123" onCancel={() => { }} />);
            expect(screen.getByText("Volver al inicio")).toBeInTheDocument();
            expect(screen.queryByText("Crear nueva sala")).not.toBeInTheDocument();
        });

        it("renders 'Crear nueva partida' when onCreate is provided", () => {
            render(<GameNotFoundCard roomId="123" onCancel={() => { }} onCreate={() => { }} />);
            expect(screen.getByText("Crear nueva sala")).toBeInTheDocument();
            expect(screen.getByText("Volver al inicio")).toBeInTheDocument();
        });

        it("calls correct callbacks on click", () => {
            const onCancel = vi.fn();
            const onCreate = vi.fn();
            render(<GameNotFoundCard roomId="123" onCancel={onCancel} onCreate={onCreate} />);

            fireEvent.click(screen.getByText("Crear nueva sala"));
            expect(onCreate).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByText("Volver al inicio"));
            expect(onCancel).toHaveBeenCalledTimes(1);
        });
    });
});
