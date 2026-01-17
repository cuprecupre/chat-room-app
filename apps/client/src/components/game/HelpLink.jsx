import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function HelpLink({ onOpenInstructions, isChatMode = false }) {
    const { t } = useTranslation('game');
    const [showModal, setShowModal] = useState(false);

    const handleOpenFullRules = () => {
        setShowModal(false);
        if (onOpenInstructions) {
            onOpenInstructions();
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="mt-10 text-sm text-neutral-400 hover:text-neutral-300 transition-colors underline underline-offset-2 w-full text-center md:text-left flex items-center justify-center md:justify-start gap-1.5"
            >
                <Info className="w-4 h-4" />
                {t('help.howToPlay', 'How to play?')}
            </button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={t('help.howToPlay', 'How to play?')}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="space-y-4 text-neutral-300">
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">1.</span>
                            <span>
                                {t('help.step1', 'Flip your card and discover if you are a')}
                                {" "}<strong className="text-white">{t('help.friend', 'friend')}</strong>{" "}
                                {t('help.step1b', "(you'll see the secret word) or")}{" "}
                                <strong className="text-orange-400">{t('help.impostor', 'impostor')}</strong>{" "}
                                {t('help.step1c', "(you won't see it).")}
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">2.</span>
                            <span>
                                {isChatMode ? t('help.step2Chat') : t('help.step2')}
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">3.</span>
                            <span>
                                <strong className="text-white">{t('help.ifFriend', 'If you are a friend:')}</strong>{" "}
                                {isChatMode ? t('help.friendAdviceChat') : t('help.friendAdvice')}
                                <br />
                                <strong className="text-orange-400">{t('help.ifImpostor', 'If you are the impostor:')}</strong>{" "}
                                {isChatMode ? t('help.impostorAdviceChat') : t('help.impostorAdvice')}
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">4.</span>
                            <span>{t('help.step4', "When everyone has given their clue, it's time to vote!")}</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">5.</span>
                            <span>
                                {t('help.step5', "Vote for who you think is the impostor. If it's you, try to incriminate someone else.")}
                            </span>
                        </p>
                    </div>

                    <div className="text-sm text-neutral-500 border-l-2 border-neutral-700 pl-4">
                        {t('help.scoring', "Those who vote correctly earn points. If you're the impostor and survive, you earn points. If you're not the impostor but the majority votes for you, you're eliminated from the round.")}
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => setShowModal(false)}
                            variant="primary"
                            size="md"
                            className="w-full"
                        >
                            {t('common:buttons.understood', 'Got it')}
                        </Button>
                        <button
                            onClick={handleOpenFullRules}
                            className="w-full text-sm text-neutral-500 hover:text-orange-400 transition-colors underline underline-offset-2"
                        >
                            {t('help.viewFullRules', 'View complete game rules')}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
