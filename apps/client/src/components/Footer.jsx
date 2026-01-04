import React from "react";
import { LogOut, Coffee } from "lucide-react";

export function Footer({ onOpenInstructions, onOpenFeedback, roomId, isMobile, onLeaveRoom, onLeaveMatch, phase }) {
    // Determine if in match (playing, round_result, game_over) vs lobby
    const isInMatch = phase === "playing" || phase === "round_result" || phase === "game_over";
    return (
        <footer className="w-full pt-6 pb-40 sm:pb-6 px-6 relative z-10">
            {/* Divider para separar del contenido */}
            <div className="max-w-4xl mx-auto w-full h-px bg-neutral-800 mb-6"></div>
            <div className="flex flex-col gap-4">
                {/* Botones globales (Reglas / Feedback / Abandonar) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                    {roomId && isInMatch && onLeaveMatch && (
                        <button
                            onClick={onLeaveMatch}
                            className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Abandonar partida</span>
                        </button>
                    )}
                    {roomId && !isInMatch && onLeaveRoom && (
                        <button
                            onClick={onLeaveRoom}
                            className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Salir de la sala</span>
                        </button>
                    )}

                    <button
                        onClick={onOpenInstructions}
                        className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>Reglas del juego</span>
                    </button>

                    <button
                        onClick={onOpenFeedback}
                        className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                        </svg>
                        <span>Ayudanos a mejorar</span>
                    </button>

                    <a
                        href="https://buymeacoffee.com/elimpostor"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors duration-150"
                        onClick={() => {
                            window.dataLayer = window.dataLayer || [];
                            window.dataLayer.push({
                                event: 'support_click',
                                location: 'footer',
                                link_url: 'https://buymeacoffee.com/elimpostor'
                            });
                        }}
                    >
                        <Coffee className="w-5 h-5" />
                        <span>Apoya al desarrollador</span>
                    </a>
                </div>

                {/* Legal Links - Only outside of games */}
                {!roomId && (
                    <div className="flex items-center justify-center gap-4 text-xs text-neutral-600 mt-4">
                        <a href="/privacidad" className="hover:text-neutral-400 transition-colors">
                            Privacidad
                        </a>
                        <span>·</span>
                        <a href="/cookies" className="hover:text-neutral-400 transition-colors">
                            Cookies
                        </a>
                    </div>
                )}
            </div>
        </footer>
    );
}
