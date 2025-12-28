import React from "react";
import { Avatar } from "../ui/Avatar";

export function TurnOverlay({ roundNumber, eliminatedPlayerInfo, isOverlayClosing }) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm px-4 transition-opacity duration-300 ${isOverlayClosing ? "opacity-0" : "animate-fadeIn"}`}
        >
            <div
                className={`text-center space-y-8 max-w-md transition-all duration-300 ${isOverlayClosing ? "opacity-0 scale-95" : "animate-scaleIn"}`}
            >
                <h2 className="text-6xl font-serif text-orange-400">
                    Ronda {roundNumber}
                </h2>

                {eliminatedPlayerInfo ? (
                    <div className="space-y-7">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar
                                photoURL={eliminatedPlayerInfo.photoURL}
                                displayName={eliminatedPlayerInfo.name}
                                size="xl"
                                className="ring-4 ring-red-500/50"
                            />
                            <p className="text-2xl text-neutral-300">
                                <span className="text-red-400">
                                    {eliminatedPlayerInfo.name}
                                </span>{" "}
                                fue eliminado
                            </p>
                        </div>
                        <p className="text-3xl text-neutral-200">
                            El impostor sigue entre nosotros
                        </p>
                    </div>
                ) : (
                    <div className="space-y-7">
                        <p className="text-3xl text-neutral-200">Nadie ha sido eliminado</p>
                        <p className="text-2xl text-neutral-400">Nueva ronda de pistas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
