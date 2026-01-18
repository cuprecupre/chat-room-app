import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

export function KickPlayerModal({ isOpen, onClose, onConfirm, playerName }) {
    const { t } = useTranslation('game');
    const { t: tc } = useTranslation('common');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('modals.kickPlayer.title')}
            size="sm"
        >
            <div className="text-center space-y-4">
                <p className="text-neutral-400 text-pretty">
                    {t('modals.kickPlayer.confirmMessage', { playerName })} <span className="text-white font-medium">{playerName}</span>?
                </p>
                <div className="space-y-2 pt-2">
                    <Button
                        onClick={onConfirm}
                        variant="danger"
                    >
                        {t('modals.kickPlayer.confirm')}
                    </Button>
                    <Button onClick={onClose} variant="outline">
                        {tc('buttons.cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
