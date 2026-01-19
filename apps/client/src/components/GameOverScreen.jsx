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

export function GameOverScreen({ state, isHost, onPlayAgain, onEndMatch, user }) {
    const { t, i18n } = useTranslation('game');
    const { t: tc } = useTranslation('common');
    const navigate = useNavigate();
    const [showScoringModal, setShowScoringModal] = useState(false);
    const [showSaveProgressModal, setShowSaveProgressModal] = useState(false);
    // State for the initial dramatic reveal overlay
    const [showRevealOverlay, setShowRevealOverlay] = useState(true);

    // Auto-dismiss reveal overlay after 5 seconds
    useEffect(() => {
        if (state.phase === "game_over" && showRevealOverlay) {
            const timer = setTimeout(() => {
                setShowRevealOverlay(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [state.phase, showRevealOverlay]);

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

    // --- REVEAL OVERLAY COMPONENT ---
    if (showRevealOverlay) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 p-4 animate-fadeIn">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-8 text-center animate-scaleIn">
                    <div className="space-y-6">
                        <div>
                            <h2 className={`text-6xl md:text-8xl font-serif tracking-tight ${impostorWon ? 'text-orange-500' : 'text-green-400'}`}>
                                {winnerTitle}
                            </h2>
                        </div>
                        {winnerSubtitle && (
                            <p className="text-2xl md:text-3xl text-neutral-400 font-serif italic">
                                {winnerSubtitle}
                            </p>
                        )}
                    </div>

                    <div className="w-24 h-px bg-white/20 mx-auto"></div>

                    <div className="space-y-6 animate-fadeIn animate-delay-300">
                        <p className="text-sm uppercase tracking-widest text-neutral-500 font-bold">
                            {t('gameOver.impostorWas')}
                        </p>
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <Avatar
                                    src={impostor?.photoURL}
                                    alt={impostor?.name}
                                    size="2xl"
                                    className={`ring-8 ring-offset-4 ring-offset-neutral-950 ${impostorWon ? 'ring-orange-500' : 'ring-green-500/50'}`}
                                />
                                {!impostorWon && (
                                    <div className="absolute -top-4 -right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter animate-pulse shadow-lg">
                                        {t('playing.eliminated')}
                                    </div>
                                )}
                            </div>
                            <p className="text-4xl md:text-5xl text-white font-serif drop-shadow-2xl">
                                {impostor?.name || t('gameOver.unknown')}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setShowRevealOverlay(false)}
                        variant="ghost"
                        className="text-neutral-500 hover:text-white mt-8"
                    >
                        {tc('buttons.skip', 'Skip')}
                    </Button>
                </div>

                {/* Harmonized Full-width Progress Bar */}
                <div className="fixed bottom-0 left-0 right-0 h-3 bg-neutral-900 pointer-events-none">
                    <div
                        className="h-full bg-white origin-left animate-progress"
                        style={{ animationDuration: '5000ms' }}
                    ></div>
                </div>
            </div>
        );
    }

    // --- MAIN GAME OVER SCREEN ---
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
                <h1 className={`text-3xl md:text-5xl font-serif ${impostorWon ? 'text-orange-400' : 'text-green-400'}`}>
                    {winnerTitle}
                </h1>
                {winnerSubtitle && (
                    <p className={`text-xl md:text-2xl mt-2 ${impostorWon ? 'text-orange-400' : 'text-green-400'}`}>
                        {winnerSubtitle}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-12 items-start max-w-lg mx-auto pb-32">
                <div className="w-full">
                    <h2 className="text-2xl font-serif text-white mb-6 text-center">
                        {t('gameOver.leaderboard')}
                    </h2>
                    <div className="rounded-2xl p-1">
                        <PlayerList
                            players={allPlayers}
                            connectedPlayers={state.players}
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

                {/* Impostor Reveal - Moved below leaderboard */}
                <div className="w-full bg-neutral-900 rounded-2xl p-6 md:p-8 text-center space-y-6">
                    {/* Impostor */}
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 mb-2">
                            {t('gameOver.impostorWas')}
                        </p>
                        {impostor ? (
                            <span className="text-xl text-white font-medium">
                                {impostor.name}
                            </span>
                        ) : (
                            <span className="text-neutral-500">{t('gameOver.unknown')}</span>
                        )}
                    </div>

                    {/* Secret Word - Conditional */}
                    {state.secretWord && (
                        <>
                            {/* Horizontal Divider */}
                            <div className="w-full h-px bg-white/10"></div>

                            <div className="flex flex-col items-center justify-center">
                                <p className="text-xs uppercase tracking-wider text-neutral-400 mb-2">
                                    {t('gameOver.secretWord')}
                                </p>
                                <p className="text-xl text-white font-medium capitalize">
                                    {displaySecretWord}
                                </p>
                            </div>
                        </>
                    )}
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
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className={`bg-gradient-to-t from-neutral-950 from-60% to-transparent pt-12 ${isHost ? 'pb-6 px-4' : 'pb-0 px-0'}`}>
                    <div className="w-full flex flex-col items-center">
                        {isHost ? (
                            <>
                                {state.players.length < 3 && (
                                    <Button
                                        onClick={onEndMatch}
                                        variant="outline"
                                        size="lg"
                                        className="w-full max-w-sm text-base py-4 mb-4 mx-6 bg-neutral-950"
                                    >
                                        {t('gameOver.returnToRoom', 'Volver a la sala')}
                                    </Button>
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
                                    className="w-full max-w-sm text-lg py-6 mb-2 mx-6"
                                >
                                    {tc('buttons.playAgain')}
                                </Button>
                                {state.players.length < 3 && (
                                    <p className="text-neutral-400 text-xs text-center mb-6">
                                        {t('gameOver.needMorePlayers', 'Se necesitan al menos 3 jugadores para jugar otra partida')}
                                    </p>
                                )}
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
                </div>
            </div>
        </div>
    );
}
