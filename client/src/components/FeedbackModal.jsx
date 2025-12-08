
import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from './ui/Button';
import ReCAPTCHA from "react-google-recaptcha";

export function FeedbackModal({ isOpen, onClose, user }) {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('bug'); // bug, suggestion, other
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [errorObject, setErrorObject] = useState(null);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setStatus('idle');

        try {
            // Timeout de 10 segundos para evitar que se quede colgado
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            );

            await Promise.race([
                addDoc(collection(db, 'feedback'), {
                    message,
                    type,
                    userId: user?.uid || 'anonymous',
                    userEmail: user?.email || 'anonymous',
                    createdAt: serverTimestamp(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    version: 'v1.0.0'
                }),
                timeoutPromise
            ]);

            setStatus('success');
            setMessage('');
            setTimeout(() => {
                onClose();
                setStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('Error sending feedback:', error);
            setErrorObject(error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-neutral-900 rounded-xl w-full max-w-md shadow-2xl ring-1 ring-white/10 overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Enviar sugerencias</h3>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {status === 'success' ? (
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
                                <div className="flex gap-2">
                                    {['bug', 'suggestion', 'other'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${type === t
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                                }`}
                                        >
                                            {t === 'bug' && '🚨 Problema'}
                                            {t === 'suggestion' && '💡 Idea'}
                                            {t === 'other' && '💭 Otros'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Tu comentario
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Cuéntanos qué ha pasado o qué te gustaría ver..."
                                    className="w-full h-32 bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all"
                                    required
                                />
                            </div>

                            {status === 'error' && (
                                <p className="text-red-400 text-sm bg-red-400/10 p-2 rounded">
                                    {(errorObject && errorObject.message) || 'Hubo un error al enviar el mensaje. Inténtalo de nuevo.'}
                                </p>
                            )}

                            <div className="flex justify-center py-2">
                                <ReCAPTCHA
                                    sitekey="6LfyhSQsAAAAAPzBaA09vL6sXcIDTqArPC301LQg"
                                    onChange={(val) => setCaptchaVerified(!!val)}
                                    theme="dark"
                                />
                            </div>

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
                                    disabled={isSubmitting || !message.trim() || !captchaVerified}
                                    className="flex-1"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
