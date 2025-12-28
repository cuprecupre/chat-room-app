import React from "react";
import { Button } from "../ui/Button";

export function MigrationScreen({ onMigrateGame, isHost }) {
    return (
        <div className="w-full max-w-sm mx-auto text-center space-y-6 py-8">
            <div className="mx-auto w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="text-5xl">🔄</span>
            </div>

            <div className="space-y-3">
                <h2 className="text-3xl font-serif text-neutral-50">
                    ¡Nueva versión disponible!
                </h2>
                <p className="text-neutral-400 text-lg leading-relaxed">
                    Hemos mejorado el sistema de juego.
                    <br />
                    Tu partida anterior necesita actualizarse.
                </p>
            </div>

            <div className="bg-white/5 rounded-xl p-5 text-left space-y-3">
                <p className="text-neutral-300 text-sm">
                    <strong className="text-orange-400">¿Qué pasará?</strong>
                </p>
                <ul className="text-neutral-400 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Se creará una nueva sala automáticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Todos los jugadores serán movidos juntos</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Podrán empezar una nueva partida inmediatamente</span>
                    </li>
                </ul>
            </div>

            {isHost ? (
                <Button
                    onClick={onMigrateGame}
                    variant="primary"
                    size="lg"
                    className="w-full"
                >
                    Continuar a nueva sala
                </Button>
            ) : (
                <div className="text-neutral-500 text-sm animate-pulse">
                    Esperando a que el anfitrión actualice la partida...
                </div>
            )}
        </div>
    );
}
