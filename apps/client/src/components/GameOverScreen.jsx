import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { PlayerList } from "./game/PlayerList";
import { Modal } from "./ui/Modal";
import { AdBanner } from "./ui/AdBanner";
import { Info } from "lucide-react";
import confetti from "canvas-confetti";
import { ROUTES } from "../routes/routes";

export function GameOverScreen({ state, isHost, onPlayAgain, user }) {
    const { t, i18n } = useTranslation('game');
    const { t: tc } = useTranslation('common');
    const navigate = useNavigate();
    const [showScoringModal, setShowScoringModal] = useState(false);
    const [showSaveProgressModal, setShowSaveProgressModal] = useState(false);



    // Confetti effect when game ends
    useEffect(() => {
        if (state.phase !== "game_over") return;

        // Burst from left
        confetti({
            particleCount: 100,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.6 },
            colors: ["#f97316", "#fb923c", "#fdba74", "#ffffff"],
        });
        // Burst from right
        confetti({
            particleCount: 100,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.6 },
            colors: ["#f97316", "#fb923c", "#fdba74", "#ffffff"],
        });
    }, [state.phase]);

    if (state.phase !== "game_over") return null;

    // Combinar jugadores conectados y desconectados que tienen puntos
    const playerScores = state.playerScores || {};
    const allPlayerUids = new Set([
        ...state.players.map((p) => p.uid),
        ...Object.keys(playerScores),
    ]);

    const allPlayers = Array.from(allPlayerUids).map((uid) => {
        const connectedPlayer = state.players.find((p) => p.uid === uid);
        if (connectedPlayer) return connectedPlayer;

        // Si no está conectado, buscar en formerPlayers
        const formerPlayer = state.formerPlayers?.[uid];
        return {
            uid,
            name: formerPlayer?.name || t('disconnectedPlayer'),
            photoURL: formerPlayer?.photoURL || null,
        };
    });

    const impostor = allPlayers.find((p) => p.uid === state.impostorId);

    // Determinar si ganó el impostor
    const impostorWon = state.winnerId === state.impostorId;

    // Titulo y subtitulo de ganador
    let winnerLabel, winnerTitle, winnerSubtitle;
    if (state.winner === "Empate") {
        winnerLabel = null;
        winnerTitle = t('gameOver.friendsWin');
        winnerSubtitle = t('gameOver.impostorCaught');
    } else if (impostorWon) {
        winnerLabel = null;
        winnerTitle = t('gameOver.impostorWin');
        winnerSubtitle = null;
    } else {
        winnerLabel = null;
        winnerTitle = t('gameOver.friendsWin');
        winnerSubtitle = t('gameOver.impostorCaught');
    }

    // Determine displayed secret word based on client language
    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';
    let displaySecretWord = state.secretWord;

    if (state.secretWordTranslations) {
        if (currentLang === 'en' && state.secretWordTranslations.en) {
            displaySecretWord = state.secretWordTranslations.en.word;
        } else if (currentLang === 'es' && state.secretWordTranslations.es) {
            displaySecretWord = state.secretWordTranslations.es.word;
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-32 pt-4 px-0 md:px-4">
            {/* Ad Banner - DESACTIVADO hasta verificación de AdSense */}
            <div className="max-w-lg mx-auto mb-10">
                <AdBanner slot="4497969935" />
            </div>

            {/* Ganador */}
            <div className="text-center mb-6 md:mb-12">
                {winnerLabel && (
                    <p className="text-sm text-neutral-400 uppercase tracking-widest mb-2">
                        {winnerLabel}
                    </p>
                )}
                <h1 className="text-3xl md:text-5xl font-serif text-orange-400">{winnerTitle}</h1>
                {winnerSubtitle && (
                    <p className="text-xl md:text-2xl text-neutral-300 mt-2">{winnerSubtitle}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-12 items-start max-w-lg mx-auto pb-32">
                {/* Impostor Reveal */}
                <div className="w-full bg-neutral-900 rounded-2xl p-6 md:p-8 text-center">
                    <div className="grid grid-cols-2 gap-x-8 items-start relative">
                        {/* Impostor Column */}
                        <div className="flex flex-col items-center justify-center px-4">
                            <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                                {t('gameOver.impostorWas')}
                            </p>
                            {impostor ? (
                                <div className="flex items-center justify-center w-full">
                                    <span className="text-xl text-white font-medium text-center break-words leading-tight max-w-full">
                                        {impostor.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-neutral-500">{t('gameOver.unknown')}</span>
                            )}
                        </div>

                        {/* Secret Word Column - Conditional */}
                        {state.secretWord && (
                            <>
                                {/* Vertical Divider */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>

                                <div className="flex flex-col items-center justify-center px-4">
                                    <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
                                        {t('gameOver.secretWord')}
                                    </p>
                                    <p className="text-xl text-white font-medium text-center break-words leading-tight max-w-full capitalize">
                                        {displaySecretWord}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    <h2 className="text-2xl font-serif text-white mb-6 text-center">
                        {t('gameOver.leaderboard')}
                    </h2>
                    <div className="rounded-2xl p-1">
                        <PlayerList
                            players={allPlayers}
                            currentUserId={user.uid}
                            isHost={isHost}
                            gameState={state}
                        />
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowScoringModal(true)}
                            className="mt-6 inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                        >
                            <Info className="w-5 h-5" />
                            {t('gameOver.howPointsWork')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de puntuación */}
            <Modal
                isOpen={showScoringModal}
                onClose={() => setShowScoringModal(false)}
                title={t('scoring.title')}
                size="lg"
            >
                <div className="space-y-8">
                    {/* Amigo */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-serif text-orange-400">{t('scoring.ifFriend')}</h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    {t('scoring.perRoundVoteImpostor')}
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium whitespace-nowrap">
                                    +2 {tc('labels.points')}
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    <span className="text-yellow-400">★</span> {t('scoring.bonusFriend')}
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium whitespace-nowrap">
                                    10 {tc('labels.points')}
                                </span>
                            </li>
                        </ul>
                    </div>

                    <hr className="border-white/10" />

                    {/* Impostor */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-serif text-orange-400">{t('scoring.ifImpostor')}</h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    {t('scoring.perRoundSurvive')}
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium whitespace-nowrap">
                                    +2 {tc('labels.points')}
                                </span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-neutral-300">
                                    <span className="text-yellow-400">★</span> {t('scoring.bonusImpostor')}
                                </span>
                                <span className="bg-white/5 px-3 py-1 rounded text-orange-400 font-medium whitespace-nowrap">
                                    10 {tc('labels.points')}
                                </span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        onClick={() => setShowScoringModal(false)}
                        variant="primary"
                        size="md"
                        className="w-full"
                    >
                        {tc('buttons.understood')}
                    </Button>
                </div>
            </Modal>


            {/* Bottom Bar (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 pt-16 pb-0 px-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent z-40" >
                <div className="w-full flex flex-col items-center">
                    {isHost ? (
                        <>
                            {state.players.length < 3 && (
                                <div className="w-full max-w-sm mb-4 mx-6">
                                    <div className="bg-orange-900/50 border border-orange-500/30 rounded-lg px-4 py-3">
                                        <p className="text-orange-200 text-sm text-center">
                                            {t('gameOver.needMorePlayers', 'Se necesitan al menos 3 jugadores para jugar otra partida')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <Button
                                onClick={() => {
                                    window.dataLayer = window.dataLayer || [];
                                    window.dataLayer.push({
                                        event: 'play_again_click',
                                        location: 'game_over_screen',
                                    });
                                    onPlayAgain();
                                }}
                                variant="primary"
                                size="lg"
                                disabled={state.players.length < 3}
                                className="w-full max-w-sm text-lg py-6 mb-6 mx-6"
                            >
                                {tc('buttons.playAgain')}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full bg-orange-900 px-3 py-2 shadow-2xl animate-slideUp flex items-center justify-center min-h-[64px]">
                            <p className="text-orange-50 text-sm leading-tight text-center w-full">
                                <svg
                                    className="animate-spin h-5 w-5 text-orange-200 inline-block align-middle mr-3 -translate-y-[1px]"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-40"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                {t('gameOver.waitingForHost')} <span className="text-orange-400 font-bold">
                                    {state.players.find((p) => p.uid === state.hostId)?.name ||
                                        "host"}
                                </span> {t('gameOver.toStartAnother')}
                            </p>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
