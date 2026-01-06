import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

export function LeaveMatchModal({ isOpen, onClose, onConfirm, isGameOver }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="¿Abandonar partida?"
            size="sm"
        >
            <div className="text-center space-y-4">
                <p className="text-neutral-400">
                    {isGameOver
                        ? "Volverás a la sala de espera."
                        : "Perderás tu avance en esta partida y volverás a la sala de espera."}
                </p>
                <div className="space-y-2 pt-2">
                    <Button
                        onClick={onConfirm}
                        variant="danger"
                    >
                        Sí, abandonar
                    </Button>
                    <Button onClick={onClose} variant="outline">
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
