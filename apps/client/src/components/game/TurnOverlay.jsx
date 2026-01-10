import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "../ui/Avatar";

export function TurnOverlay({ roundNumber, eliminatedPlayerInfo, isOverlayClosing }) {
    const { t } = useTranslation('common');

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm px-4 transition-opacity duration-300 ${isOverlayClosing ? "opacity-0" : "animate-fadeIn"}`}
        >
            <div
                className={`text-center space-y-8 max-w-md transition-all duration-300 ${isOverlayClosing ? "opacity-0 scale-95" : "animate-scaleIn"}`}
            >
                <h2 className="text-6xl font-serif text-orange-400">
                    {t('game.round')} {roundNumber}
                </h2>

                {eliminatedPlayerInfo ? (
                    <div className="space-y-7">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar
                                photoURL={eliminatedPlayerInfo.photoURL}
                                displayName={eliminatedPlayerInfo.name}
                                size="xl"
                                className="ring-4 ring-red-500/50"
                            />
                            <p className="text-2xl text-neutral-300">
                                <span className="text-red-400">
                                    {eliminatedPlayerInfo.name}
                                </span>{" "}
                                {t('game.wasEliminated')}
                            </p>
                        </div>
                        <p className="text-3xl text-neutral-200">
                            {t('game.impostorRemains')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-7">
                        <p className="text-3xl text-neutral-200">{t('game.nobodyEliminated')}</p>
                        <p className="text-2xl text-neutral-400">{t('game.newClueRound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
