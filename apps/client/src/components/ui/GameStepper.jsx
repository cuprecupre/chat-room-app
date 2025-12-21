import React from "react";

export function GameStepper({ roundCount = 1, currentTurn = 1, showAnimation = true }) {
    return (
        <div
            className={`w-full max-w-4xl mx-auto -mt-3 md:mt-0 ${showAnimation ? "animate-fadeIn animate-delay-200" : ""}`}
        >
            <div className="flex items-center gap-4 justify-center">
                {/* Número de partida */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-400">
                        Partida
                    </span>
                </div>

                {/* Separador */}
                <div className="h-4 w-px bg-neutral-700"></div>

                {/* Stepper de rondas */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {[1, 2, 3].map((turn) => (
                        <div key={turn} className="flex flex-col min-[380px]:flex-row items-center gap-1 min-[380px]:gap-1.5">
                            {/* Círculo con número */}
                            <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium transition-all ${currentTurn > turn
                                    ? "bg-green-500/20 text-green-400"
                                    : currentTurn === turn
                                        ? "bg-white text-neutral-900"
                                        : "bg-neutral-800 text-neutral-500"
                                    }`}
                            >
                                {currentTurn > turn ? (
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    <div className={`w-1 h-1 rounded-full ${currentTurn === turn ? "bg-neutral-900" : "bg-neutral-500"
                                        }`} />
                                )}
                            </div>
                            {/* Etiqueta de la ronda - solo en desktop */}
                            <span
                                className={`text-xs ${currentTurn === turn
                                    ? "text-neutral-200"
                                    : currentTurn > turn
                                        ? "text-green-400/70"
                                        : "text-neutral-600"
                                    }`}
                            >
                                Ronda {turn}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            {/* Divider */}
            <div className="h-px w-full bg-white/10 mt-3 md:mt-6"></div>
        </div>
    );
}
