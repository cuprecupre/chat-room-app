import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

export function LeaveMatchModal({ isOpen, onClose, onConfirm, isGameOver, isHost }) {
    const getMessage = () => {
        if (isGameOver) {
            return "Volverás a la sala.";
        }
        if (isHost) {
            return "Como anfitrión si abandonas la partida se terminará para los demás jugadores. Todos irán juntos a la sala donde podrás comenzar una nueva partida.";
        }
        return "Perderás tu avance en esta partida y volverás a la sala.";
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isGameOver ? "¿Volver a la sala?" : "¿Abandonar partida?"}
            size="sm"
        >
            <div className="text-center space-y-4">
                <p className="text-neutral-400">
                    {getMessage()}
                </p>
                <div className="space-y-2 pt-2">
                    <Button
                        onClick={onConfirm}
                        variant="danger"
                    >
                        Abandonar
                    </Button>
                    <Button onClick={onClose} variant="outline">
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
