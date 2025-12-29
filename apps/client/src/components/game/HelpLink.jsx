import React, { useState } from "react";
import { Info } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function HelpLink({ onOpenInstructions }) {
    const [showModal, setShowModal] = useState(false);

    const handleOpenFullRules = () => {
        setShowModal(false);
        if (onOpenInstructions) {
            onOpenInstructions();
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="mt-10 text-sm text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2 w-full text-center md:text-left flex items-center justify-center md:justify-start gap-1.5"
            >
                <Info className="w-4 h-4" />
                ¿Cómo jugar?
            </button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="¿Cómo jugar?"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="space-y-4 text-neutral-300">
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">1.</span>
                            <span>
                                Voltea tu carta y descubre si eres{" "}
                                <strong className="text-white">amigo</strong> (verás la palabra
                                secreta) o <strong className="text-orange-400">impostor</strong> (no
                                la verás).
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">2.</span>
                            <span>
                                Cada jugador dice una pista en voz alta. Empieza el que tenga el ☀️
                                indicado en el listado de jugadores.
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">3.</span>
                            <span>
                                <strong className="text-white">Si eres amigo:</strong> Di en voz
                                alta una pista sutil que demuestre que conoces la palabra, pero sin
                                revelarla.
                                <br />
                                <strong className="text-orange-400">Si eres impostor:</strong> Finge
                                que la conoces usando pistas vagas o que imiten a otros.
                            </span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">4.</span>
                            <span>Cuando todos hayan dado su pista, ¡es hora de votar!</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="text-orange-400 font-semibold">5.</span>
                            <span>
                                Vota a quien creas que es el impostor. Si eres tú, intenta
                                incriminar a otro.
                            </span>
                        </p>
                    </div>

                    <div className="text-sm text-neutral-500 border-l-2 border-neutral-700 pl-4">
                        Los que votan bien ganan puntos. Si eres impostor y sobrevives, ganas
                        puntos. Si no eres impostor pero la mayoría te vota, quedas eliminado de la
                        ronda.
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => setShowModal(false)}
                            variant="primary"
                            size="md"
                            className="w-full"
                        >
                            Entendido
                        </Button>
                        <button
                            onClick={handleOpenFullRules}
                            className="w-full text-sm text-neutral-500 hover:text-orange-400 transition-colors underline underline-offset-2"
                        >
                            Ver reglas completas del juego
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
