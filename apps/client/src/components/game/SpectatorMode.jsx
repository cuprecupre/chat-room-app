import React from "react";
import { useTranslation } from "react-i18next";

export function SpectatorMode() {
    const { t } = useTranslation('game');

    return (
        <div className="space-y-3">
            <div className="animate-cardEntrance">
                <div className="aspect-[4/3] w-full bg-red-950/20 border border-red-950/50 rounded-xl flex flex-col items-center justify-center px-8 py-6 text-center backdrop-blur-sm shadow-xl">
                    <div className="text-4xl mb-4">❌</div>
                    <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 leading-tight">
                        {t('spectator.eliminated', 'You have been eliminated')}
                    </h3>
                    <p className="text-red-400/80 text-base leading-relaxed">
                        {t('spectator.waitHere', 'Wait here. You will play again in the next game.')}
                    </p>
                </div>
            </div>
        </div>
    );
}
