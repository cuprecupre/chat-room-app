import React from "react";
import { useTranslation } from "react-i18next";

export function RulesContent({ isModal = false }) {
    const { t } = useTranslation('rules');
    // Si estamos en modal, usar un fondo más oscuro (950) porque el modal ya es 900.
    // Si estamos en página, usar 900 (porque el fondo de página es negro/oscuro)
    const boxBg = isModal ? "bg-neutral-950" : "bg-neutral-900";

    return (
        <div className="divide-y divide-white/10 text-neutral-300">
            {/* Introducción */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">{t('introduction.title')}</h3>
                <p className="text-lg leading-relaxed font-light">
                    <strong>{t('introduction.gameName')}</strong> {t('introduction.description')}
                </p>
                <div className={`mt-4 p-4 ${boxBg} rounded-lg`}>
                    <p className="text-base">
                        <strong>{t('introduction.recommendation')}</strong> {t('introduction.recommendationText')}
                    </p>
                </div>
            </section>

            {/* Objetivo */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">{t('objective.title')}</h3>
                <p className="text-lg leading-relaxed mb-6 font-light">
                    {t('objective.description')}{" "}
                    <strong className="text-orange-400">{t('objective.rounds')}</strong>.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className={`${boxBg} p-6 rounded-xl`}>
                        <h4 className="text-white font-semibold mb-3 text-lg">{t('objective.asFriend')}</h4>
                        <p className="text-neutral-400 text-base font-light">
                            {t('objective.friendDescription')}
                        </p>
                    </div>
                    <div className={`${boxBg} p-6 rounded-xl`}>
                        <h4 className="text-orange-400 font-semibold mb-3 text-lg">
                            {t('objective.asImpostor')}
                        </h4>
                        <p className="text-neutral-400 text-base font-light">
                            {t('objective.impostorDescription')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Qué necesitas */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">
                    {t('requirements.title')}
                </h3>
                <div className="space-y-4 text-lg text-neutral-300 font-light">
                    <p>
                        {t('requirements.device1')} <strong>{t('requirements.phone')}</strong> {t('requirements.device2')} <strong>{t('requirements.noDownload')}</strong>{t('requirements.device3')}
                    </p>
                    <p>
                        {t('requirements.communication1')}{" "}
                        <strong>{t('requirements.communicationType')}</strong>.
                    </p>
                </div>
            </section>

            {/* Preparación */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">{t('preparation.title')}</h3>
                <ol className="space-y-4 text-lg font-light list-decimal list-outside ml-6">
                    <li className="pl-2">
                        <strong className="text-white">{t('preparation.step1.title')}</strong> {t('preparation.step1.text')}{" "}
                        <strong>{t('preparation.step1.help')}</strong>.
                    </li>
                    <li className="pl-2">
                        <strong className="text-white">{t('preparation.step2.title')}</strong> {t('preparation.step2.text')}
                    </li>
                    <li className="pl-2">
                        <strong className="text-white">{t('preparation.step3.title')}</strong> {t('preparation.step3.text')}
                    </li>
                    <li className="pl-2">
                        <strong className="text-white">{t('preparation.step4.title')}</strong> {t('preparation.step4.text')}
                    </li>
                </ol>
            </section>

            {/* Desarrollo */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-8">
                    {t('gameplay.title')}
                </h3>
                <div className="space-y-8">
                    {/* 1 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                            1
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">{t('gameplay.step1.title')}</h4>
                            <p className="text-neutral-300 text-lg font-light">
                                {t('gameplay.step1.text')}{" "}
                                <strong>{t('gameplay.step1.warning')}</strong>
                            </p>
                            <ul className="list-disc ml-5 text-neutral-400 space-y-1 mt-2 font-light">
                                <li>
                                    <span className="text-neutral-300">{t('gameplay.step1.friends')}</span> {t('gameplay.step1.friendsText')}
                                </li>
                                <li>
                                    <span className="text-neutral-300">{t('gameplay.step1.impostor')}</span> {t('gameplay.step1.impostorText')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 2 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                            2
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">{t('gameplay.step2.title')}</h4>
                            <p className="text-neutral-300 text-lg font-light">
                                {t('gameplay.step2.text')}{" "}
                                <strong>
                                    {t('gameplay.step2.tip')}
                                </strong>
                            </p>
                        </div>
                    </div>

                    {/* 3 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                            3
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">{t('gameplay.step3.title')}</h4>
                            <p className="text-neutral-300 text-lg font-light">
                                {t('gameplay.step3.text')}
                            </p>
                        </div>
                    </div>

                    {/* 4 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
                            4
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">{t('gameplay.step4.title')}</h4>
                            <p className="text-neutral-300 text-lg font-light">
                                {t('gameplay.step4.text1')} <strong>{t('gameplay.step4.eliminated')}</strong>{" "}
                                {t('gameplay.step4.text2')}
                            </p>
                            <ul className="list-disc ml-5 text-neutral-400 space-y-1 mt-2 font-light">
                                <li>
                                    <strong>{t('gameplay.step4.ifImpostor')}</strong> {t('gameplay.step4.ifImpostorText')}
                                </li>
                                <li>
                                    <strong>{t('gameplay.step4.ifFriend')}</strong> {t('gameplay.step4.ifFriendText')}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Puntuación */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">{t('scoring.title')}</h3>
                <div className={`grid ${isModal ? "grid-cols-1" : "md:grid-cols-2"} gap-6`}>
                    <div className={`${boxBg} p-6 rounded-xl`}>
                        <h4 className="text-white font-semibold mb-3 text-lg">{t('scoring.friends')}</h4>
                        <ul className="text-neutral-300 space-y-2 font-light">
                            <li>
                                • {t('scoring.friendsVote')}{" "}
                                <strong className="text-orange-400">+2 pts</strong>
                            </li>
                            <li>
                                • <span className="text-yellow-400">★</span> {t('scoring.friendsBonus')}{" "}
                                <strong className="text-orange-400">10 pts</strong>
                            </li>
                        </ul>
                    </div>
                    <div className={`${boxBg} p-6 rounded-xl`}>
                        <h4 className="text-orange-400 font-semibold mb-3 text-lg">{t('scoring.impostor')}</h4>
                        <ul className="text-neutral-300 space-y-2">
                            <li>
                                • {t('scoring.impostorSurvive')}{" "}
                                <strong className="text-orange-400">+2 pts</strong>
                            </li>
                            <li>
                                • <span className="text-yellow-400">★</span> {t('scoring.impostorBonus')}{" "}
                                <strong className="text-orange-400">10 pts</strong>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className={`mt-6 ${boxBg} p-4 rounded-lg text-neutral-400 text-sm`}>
                    <strong className="text-orange-400">{t('scoring.tieTitle')}</strong> {t('scoring.tieText')}
                </div>
            </section>
        </div>
    );
}
