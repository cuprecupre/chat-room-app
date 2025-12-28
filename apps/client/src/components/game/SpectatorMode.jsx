import React from "react";

export function SpectatorMode() {
    return (
        <div className="space-y-3">
            <div className="bg-neutral-900/50 rounded-2xl p-8 text-center border border-red-500/30">
                <div className="text-4xl mb-4">👁️</div>
                <h3 className="text-xl font-medium text-neutral-300 mb-2">
                    Modo Espectador
                </h3>
                <p className="text-neutral-500 text-sm">
                    Has sido eliminado de esta partida.
                    <br />
                    Observa cómo continúa el juego.
                </p>
            </div>
        </div>
    );
}
