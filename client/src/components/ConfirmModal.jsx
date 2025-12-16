import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger' // 'danger' or 'primary'
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-neutral-300 text-base leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={onClose}
                        variant="outline"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
