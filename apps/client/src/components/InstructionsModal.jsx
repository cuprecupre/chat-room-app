import React from "react";
import { Modal } from "./ui/Modal";
import { RulesContent } from "./RulesContent";


export function InstructionsModal({ isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Instrucciones">
            <div
                className="max-w-none select-text space-y-6"
                style={{ userSelect: "text", WebkitUserSelect: "text" }}
            >
                <RulesContent />
            </div>
        </Modal>
    );
}
