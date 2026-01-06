import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

export function KickPlayerModal({ isOpen, onClose, onConfirm, playerName }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="¿Expulsar jugador?"
            size="sm"
        >
            <div className="text-center space-y-4">
                <p className="text-neutral-400">
                    ¿Estás seguro de que quieres expulsar a <span className="text-white font-medium">{playerName}</span> de la sala?
                </p>
                <div className="space-y-2 pt-2">
                    <Button
                        onClick={onConfirm}
                        variant="danger"
                    >
                        Sí, expulsar
                    </Button>
                    <Button onClick={onClose} variant="outline">
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
