import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

export function FeedbackModal({ isOpen, onClose, user }) {
    const [message, setMessage] = useState("");
    const [type, setType] = useState("bug"); // bug, suggestion, other
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, success, error
    const [errorObject, setErrorObject] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setStatus("idle");

        try {
            // Timeout de 10 segundos para evitar que se quede colgado
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 10000)
            );

            await Promise.race([
                addDoc(collection(db, "feedback"), {
                    message,
                    type,
                    userId: user?.uid || "anonymous",
                    userEmail: user?.email || "anonymous",
                    createdAt: serverTimestamp(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    version: "v1.0.0",
                }),
                timeoutPromise,
            ]);

            setStatus("success");
            setMessage("");
            setTimeout(() => {
                onClose();
                setStatus("idle");
            }, 2000);
        } catch (error) {
            console.error("Error sending feedback:", error);
            setErrorObject(error);
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ayudanos a mejorar" size="md">
            {status === "success" ? (
                <div className="text-center py-8">
                    <div className="text-5xl mb-4">✨</div>
                    <h4 className="text-xl font-bold text-green-400 mb-2">¡Mensaje enviado!</h4>
                    <p className="text-neutral-400">Gracias por ayudarnos a mejorar.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Tipo de mensaje
                        </label>
                        <div className="relative">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full appearance-none bg-neutral-800 text-white border-none rounded-lg py-2.5 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer"
                            >
                                <option value="bug">🚨 Problema</option>
                                <option value="suggestion">💡 Idea</option>
                                <option value="other">💭 Otros</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-400">
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
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Tu comentario
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Cuéntanos tu problema, sugerencia o cualquier comentario que tengas para mejorar el juego..."
                            className="w-full h-32 bg-neutral-950 border-none rounded-lg p-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-orange-500 resize-none transition-all"
                            required
                        />
                    </div>

                    {status === "error" && (
                        <p className="text-red-400 text-sm bg-red-400/10 p-2 rounded">
                            {(errorObject && errorObject.message) ||
                                "Hubo un error al enviar el mensaje. Inténtalo de nuevo."}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !message.trim()}
                            className="flex-1"
                        >
                            {isSubmitting ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
