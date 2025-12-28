import React from "react";

export function SpectatorMode() {
    return (
        <div className="space-y-3">
            <div className="animate-cardEntrance">
                <div className="aspect-[4/3] w-full bg-red-950/20 border border-red-950/50 rounded-xl flex flex-col items-center justify-center px-8 py-6 text-center backdrop-blur-sm shadow-xl">
                    <div className="text-4xl mb-4">❌</div>
                    <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 leading-tight">
                        Has sido eliminado
                    </h3>
                    <p className="text-red-400/80 text-base leading-relaxed">
                        Espera aquí. Volverás a jugar en la siguiente partida.
                    </p>
                </div>
            </div>
        </div>
    );
}
