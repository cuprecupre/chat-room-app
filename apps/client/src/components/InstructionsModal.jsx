import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./ui/Modal";
import { RulesContent } from "./RulesContent";

export function InstructionsModal({ isOpen, onClose }) {
    const { t } = useTranslation('rules');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modalTitle', 'Instructions')}>
            <div
                className="max-w-none select-text space-y-6"
                style={{ userSelect: "text", WebkitUserSelect: "text" }}
            >
                {/* Contenido (Reutilizado de la página principal) */}
                <RulesContent isModal={true} />
            </div>
        </Modal>
    );
}
