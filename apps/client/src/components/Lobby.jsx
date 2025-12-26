import React, { useState } from "react";
import { Button } from "./ui/Button";
import homeImg from "../assets/impostor-home.jpg";

export function Lobby({ onCreateGame }) {
    const [showImpostorHint, setShowImpostorHint] = useState(true);

    const handleCreateGame = () => {
        onCreateGame({ showImpostorHint });
    };

    return (
        <div className="w-full space-y-8">
            <div className="text-center space-y-6">
                <img
                    src={homeImg}
                    alt="Impostor"
                    className="mx-auto w-56 h-56 rounded-full object-cover shadow-lg ring-1 ring-white/10"
                    loading="lazy"
                />
                <h2 className="text-4xl font-serif text-neutral-50 tracking-tight">
                    ¿Listos para jugar?
                </h2>
                <div className="space-y-4">
                    <p className="text-lg text-neutral-50 leading-relaxed max-w-md mx-auto">
                        Crea una partida rápida e invita a tus amigos para descubrir al impostor.
                    </p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-snug">
                        Si juegan a distancia, una videollamada hará el juego mucho más interesante.
                    </p>
                </div>
            </div>
            <div className="max-w-sm mx-auto space-y-4">
                <Button onClick={handleCreateGame} variant="primary" size="md" className="w-full">
                    Crear nueva partida
                </Button>

                {/* Opciones de juego */}
                <div className="bg-white/5 rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer gap-4">
                        <div className="flex-1">
                            <span className="text-sm text-neutral-300">Jugar en modo fácil</span>
                            <p className="text-xs text-neutral-500 mt-1">
                                El Impostor recibirá una pista sobre la palabra secreta para que le
                                sea más fácil mentir.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowImpostorHint(!showImpostorHint)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-neutral-950 ${
                                showImpostorHint ? "bg-orange-500" : "bg-neutral-700"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                    showImpostorHint ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                        </button>
                    </label>
                </div>
            </div>
        </div>
    );
}
