import React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

export function LeaveMatchModal({ isOpen, onClose, onConfirm, isGameOver, isHost }) {
    const { t } = useTranslation('game');
    const { t: tc } = useTranslation('common');

    const getMessage = () => {
        if (isGameOver) {
            return t('modals.leaveMatch.returnToRoom', 'You will return to the room.');
        }
        if (isHost) {
            return t('modals.leaveMatch.hostWarning', 'As the host, if you leave, the game will end for all players. Everyone will go to the room where you can start a new game.');
        }
        return t('modals.leaveMatch.description');
    };

    const getTitle = () => {
        if (isGameOver) {
            return t('modals.leaveMatch.returnTitle', 'Return to room?');
        }
        return t('modals.leaveMatch.title');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="sm"
        >
            <div className="text-center space-y-4">
                <p className="text-neutral-400 text-pretty">
                    {getMessage()}
                </p>
                <div className="space-y-2 pt-2">
                    <Button
                        onClick={onConfirm}
                        variant="danger"
                    >
                        {t('modals.leaveMatch.confirm')}
                    </Button>
                    <Button onClick={onClose} variant="outline">
                        {tc('buttons.cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
