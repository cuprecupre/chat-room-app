import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

export function LeaveRoomModal({ isOpen, onClose, onConfirm }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="¿Salir de la sala?"
            size="sm"
        >
            <div className="text-center space-y-4">
                <p className="text-neutral-400">
                    Saldrás de la sala por completo. Deberás ser invitado nuevamente para entrar.
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
