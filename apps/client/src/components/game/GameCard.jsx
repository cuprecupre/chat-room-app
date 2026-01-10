import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";
import { capitalize } from "./utils";

// Firebase Storage CDN URLs
const CDN_BASE = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2F";
const CDN_SUFFIX = "?alt=media";
const cardImg = `${CDN_BASE}card.jpg${CDN_SUFFIX}`;
const cardBackImg = `${CDN_BASE}card-back.jpg${CDN_SUFFIX}`;

export function GameCard({ state, initialAnimationPending, showCardEntrance, showRestOfUI }) {
    const { t, i18n } = useTranslation('game');
    const [reveal, setReveal] = useState(false);
    const [cardAnimating, setCardAnimating] = useState(false);
    const revealTimeoutRef = useRef(null);
    const cardFloatTimeoutRef = useRef(null);
    const prevTurnRef = useRef(state.currentRound);
    const prevPhaseRef = useRef(state.phase);

    // Reveal helpers
    const triggerReveal = () => {
        if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

        const newRevealState = !reveal;
        setReveal(newRevealState);

        // Si voltea la carta (muestra el dorso), iniciar temporizador para volver al frente después de 5 segundos
        if (newRevealState) {
            revealTimeoutRef.current = setTimeout(() => {
                setReveal(false);
            }, 5000);
        }
    };

    // Detectar cambio de ronda para resetear carta
    useEffect(() => {
        const prevRound = prevTurnRef.current;
        const currentRound = state.currentRound;

        if (
            state.phase === "playing" &&
            prevRound &&
            currentRound > prevRound &&
            currentRound > 1
        ) {
            setReveal(false);
        }
        prevTurnRef.current = currentRound;
    }, [state.currentRound, state.phase]);

    // Resetear carta cuando empieza una nueva partida (playing)
    useEffect(() => {
        const prevPhase = prevPhaseRef.current;
        const currentPhase = state.phase;

        if (currentPhase === "playing" && prevPhase !== "playing") {
            setReveal(false);
        }
        prevPhaseRef.current = currentPhase;
    }, [state.phase]);

    // Iniciar animación de carta al entrar en fase playing
    useEffect(() => {
        if (state.phase === "playing") {
            setCardAnimating(true);
            if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
            cardFloatTimeoutRef.current = setTimeout(() => {
                setCardAnimating(false);
            }, 7000);
        }
        return () => {
            if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
        };
    }, [state.phase]);

    useEffect(() => {
        return () => {
            if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
        };
    }, []);


    return (
        <div className="space-y-3">
            <div
                className={`${initialAnimationPending ? "opacity-0" : ""} ${showCardEntrance ? "animate-cardEntrance" : ""}`}
            >
                <div
                    className={`flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full ${cardAnimating ? "animate-card-float-complete" : ""}`}
                >
                    <div
                        className={`flip-card-inner h-full cursor-pointer ${reveal ? "is-flipped" : ""}`}
                        onClick={triggerReveal}
                        title={t('card.tapToFlip', 'Tap to flip card')}
                    >
                        {/* Frente completo (card completa con imagen) */}
                        <div className="flip-card-front">
                            <div className="h-full flex items-center justify-center">
                                <img
                                    src={cardImg}
                                    alt={t('card.frontAlt', 'Card front')}
                                    className="w-full h-full object-cover rounded-xl pointer-events-none"
                                    title={t('card.viewCard', 'View my card')}
                                />
                            </div>
                        </div>
                        {/* Dorso completo (card completa con información) */}
                        <div className="flip-card-back">
                            <div className="relative h-full flex flex-col items-center justify-center rounded-xl overflow-hidden">
                                {/* Imagen de fondo */}
                                <img
                                    src={cardBackImg}
                                    alt={t('card.backAlt', 'Card back')}
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                                {/* Contenido sobre la imagen */}
                                <div
                                    className="relative z-10 text-center p-8 backdrop-blur-sm rounded-xl pointer-events-none"
                                    title={t('card.flipBack', 'Flip back')}
                                >
                                    {/* Main Content (Role & Word) */}
                                    <div className="flex-1 flex flex-col items-center justify-center py-6 gap-8">
                                        {(() => {
                                            // Dynamic Content Resolution
                                            const langKey = i18n.language?.split('-')[0] || 'es';
                                            const translations = state.secretWordTranslations?.[langKey];

                                            // Resolve Word
                                            let displayWord = translations?.word || state.secretWord;

                                            // Handle special keys (Impostor Hint)
                                            if (displayWord === 'SECRET_WORD_HINT') {
                                                displayWord = t('card.hint');
                                            }

                                            // Resolve Category
                                            const displayCategory = translations?.category || state.secretCategory;

                                            return (
                                                <>
                                                    <div>
                                                        {state.role === 'impostor' ? (
                                                            <div className="flex flex-col items-center">
                                                                <p className="text-xl font-serif mt-1 text-white">
                                                                    {t('playing.youAreImpostor')}
                                                                </p>
                                                                <p className="text-white text-xs leading-relaxed mt-2 opacity-90">
                                                                    {t('playing.tryToBlend')}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center justify-center gap-2 text-xs text-orange-400 uppercase font-medium">
                                                                    <span>{t('card.yourRole', 'Your role')}</span>
                                                                </div>
                                                                <p className="text-xl font-serif mt-1 text-white">
                                                                    {capitalize(t(`roles.${state.role}`, state.role))}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="w-full">
                                                        {state.role === 'impostor' ? (
                                                            // Impostor View
                                                            <div className="w-full px-1 mx-auto">
                                                                {displayCategory && (
                                                                    <div className="mb-6">
                                                                        <div className="text-center">
                                                                            <span className="text-xs text-orange-400 block mb-1 uppercase font-medium whitespace-pre-line">
                                                                                {t('playing.impostorHint')}
                                                                            </span>
                                                                            <span className="text-xl font-serif text-white block">
                                                                                {capitalize(displayCategory)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        ) : (
                                                            // Friend View
                                                            <div className="min-w-[180px] mx-auto">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <p className="text-orange-400 text-xs uppercase font-medium">
                                                                        {t('card.secretWord')}
                                                                    </p>
                                                                    <p className="text-xl font-serif text-white mb-2">
                                                                        {capitalize(displayWord)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div >
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Botón Girar carta */}
            <div
                className={`flex justify-center mt-6 ${showRestOfUI ? "animate-fadeIn animate-delay-600" : "opacity-0 pointer-events-none"}`}
            >
                <Button
                    onClick={triggerReveal}
                    variant="outline"
                    size="sm"
                    className="gap-2 !w-auto !border-orange-500 !text-orange-400 hover:!bg-orange-500/10"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <span>{t('card.flipYourCard', 'Reveal your card')}</span>
                </Button>
            </div>
        </div >
    );
}

export default GameCard;
