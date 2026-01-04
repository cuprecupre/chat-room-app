import React, { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "./ui/Button";

// Firebase Storage CDN URL
const homeImg = "https://firebasestorage.googleapis.com/v0/b/impostor-468e0.firebasestorage.app/o/impostor-assets%2Fimpostor-home.jpg?alt=media";

export function Lobby({ onCreateGame }) {
    const handleCreateGame = () => {
        onCreateGame();
    };

    return (
        <div className="w-full space-y-8 pt-8">
            <div className="text-center space-y-6">
                <img
                    src={homeImg}
                    alt="Impostor"
                    className="mx-auto w-56 h-56 rounded-full object-cover shadow-lg ring-1 ring-white/10"
                    loading="lazy"
                />
                <h2 className="text-4xl font-serif text-neutral-50 tracking-tight">
                    Empezar a jugar
                </h2>
                <div className="space-y-4">
                    <p className="text-xl font-light text-neutral-400 leading-relaxed max-w-md mx-auto">
                        Crea una sala, invita a tus amigos <br /> y empieza a jugar
                    </p>
                </div>
            </div>
            <div className="max-w-sm mx-auto space-y-6">
                <Button onClick={handleCreateGame} variant="primary" size="md" className="w-full h-12 text-lg rounded-full shadow-lg">
                    Crear nueva sala
                </Button>



                <div className="bg-neutral-500/10 rounded-lg p-4 flex gap-3 items-start text-left">
                    <Video className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-400 leading-snug">
                        Si juegas a distancia con tus amigos, una videollamada por WhatsApp o Zoom hará el juego mucho más divertido.
                    </p>
                </div>
            </div>
        </div>
    );
}
