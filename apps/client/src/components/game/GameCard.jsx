import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import { capitalize } from "./utils";

// Firebase Storage CDN URLs
const CDN_BASE = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2F";
const CDN_SUFFIX = "?alt=media";
const cardImg = `${CDN_BASE}card.jpg${CDN_SUFFIX}`;
const cardBackImg = `${CDN_BASE}card-back.jpg${CDN_SUFFIX}`;

export function GameCard({ state, initialAnimationPending, showCardEntrance, showRestOfUI }) {
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
                        title="Toca para voltear la carta"
                    >
                        {/* Frente completo (card completa con imagen) */}
                        <div className="flip-card-front">
                            <div className="h-full flex items-center justify-center">
                                <img
                                    src={cardImg}
                                    alt="Frente de la carta"
                                    className="w-full h-full object-cover rounded-xl pointer-events-none"
                                    title="Ver mi carta"
                                />
                            </div>
                        </div>
                        {/* Dorso completo (card completa con información) */}
                        <div className="flip-card-back">
                            <div className="relative h-full flex flex-col items-center justify-center rounded-xl overflow-hidden">
                                {/* Imagen de fondo */}
                                <img
                                    src={cardBackImg}
                                    alt="Fondo del dorso"
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                                {/* Contenido sobre la imagen */}
                                <div
                                    className="relative z-10 text-center p-8 backdrop-blur-sm rounded-xl pointer-events-none"
                                    title="Volver al frente"
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-orange-400">
                                                <span>Tu rol</span>
                                            </div>
                                            <p className="text-xl font-serif mt-1 text-white">
                                                {capitalize(state.role)}
                                            </p>
                                        </div>

                                        {/* Línea separadora */}
                                        <div className="w-full h-px bg-white/20"></div>

                                        {state.role === "impostor" ? (
                                            <>
                                                {state.secretCategory && (
                                                    <div>
                                                        <div className="flex flex-col items-center justify-center gap-1 text-xs tracking-wider text-orange-400">
                                                            <span className="uppercase">
                                                                Ayuda:
                                                            </span>
                                                            <span className="normal-case">
                                                                La palabra
                                                                secreta está
                                                                relacionada
                                                                con...
                                                            </span>
                                                        </div>
                                                        <p className="font-serif text-xl mt-1 text-white underline decoration-dotted underline-offset-4">
                                                            {capitalize(
                                                                state.secretCategory
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-orange-400">
                                                    <span>
                                                        Palabra secreta
                                                    </span>
                                                </div>
                                                <p className="font-serif text-xl mt-1 text-white">
                                                    {capitalize(
                                                        state.secretWord
                                                    )}
                                                </p>
                                            </div>
                                        )}
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
                    <span>Descubre tu carta</span>
                </Button>
            </div>
        </div>
    );
}
