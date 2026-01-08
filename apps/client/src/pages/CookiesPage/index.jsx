import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function CookiesPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 py-12 px-6 pb-64 md:pb-24 font-sans">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </Link>

                <h1 className="text-4xl font-serif text-white mb-8">Política de Cookies</h1>

                <div className="prose prose-invert prose-neutral max-w-none space-y-8">
                    <p className="text-neutral-400 text-lg">
                        Última actualización: Enero 2026
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif text-orange-400">¿Qué son las cookies?</h2>
                        <p className="text-neutral-300 leading-relaxed">
                            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web.
                            Nos permiten recordar tus preferencias y mejorar tu experiencia de navegación.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif text-orange-400">Cookies que utilizamos</h2>

                        {/* Cookies Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-700">
                                        <th className="py-3 px-4 text-neutral-300 font-medium">Cookie</th>
                                        <th className="py-3 px-4 text-neutral-300 font-medium">Tipo</th>
                                        <th className="py-3 px-4 text-neutral-300 font-medium">Duración</th>
                                        <th className="py-3 px-4 text-neutral-300 font-medium">Finalidad</th>
                                    </tr>
                                </thead>
                                <tbody className="text-neutral-400">
                                    <tr className="border-b border-neutral-800">
                                        <td className="py-3 px-4">cookie_consent</td>
                                        <td className="py-3 px-4">Necesaria</td>
                                        <td className="py-3 px-4">1 año</td>
                                        <td className="py-3 px-4">Recordar tu preferencia de cookies</td>
                                    </tr>
                                    <tr className="border-b border-neutral-800">
                                        <td className="py-3 px-4">Firebase Auth</td>
                                        <td className="py-3 px-4">Necesaria</td>
                                        <td className="py-3 px-4">Sesión</td>
                                        <td className="py-3 px-4">Mantener tu sesión de juego</td>
                                    </tr>
                                    <tr className="border-b border-neutral-800">
                                        <td className="py-3 px-4">_ga, _gid, SL_*</td>
                                        <td className="py-3 px-4">Analítica</td>
                                        <td className="py-3 px-4">2 años</td>
                                        <td className="py-3 px-4">Google Analytics, Smartlook - Estadísticas de uso</td>
                                    </tr>
                                    <tr className="border-b border-neutral-800">
                                        <td className="py-3 px-4">_gcl_au</td>
                                        <td className="py-3 px-4">Publicidad</td>
                                        <td className="py-3 px-4">3 meses</td>
                                        <td className="py-3 px-4">Google AdSense - Publicidad</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif text-orange-400">Tipos de cookies</h2>

                        <div className="space-y-4">
                            <div className="bg-neutral-900 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-white mb-2">🔒 Cookies necesarias</h3>
                                <p className="text-neutral-400 text-sm">
                                    Imprescindibles para el funcionamiento del juego. No requieren consentimiento
                                    y no se pueden desactivar.
                                </p>
                            </div>

                            <div className="bg-neutral-900 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-white mb-2">📊 Cookies de analítica</h3>
                                <p className="text-neutral-400 text-sm">
                                    Nos ayudan a entender cómo usas el juego para mejorarlo.
                                    Puedes rechazarlas sin que afecte a la funcionalidad.
                                </p>
                            </div>

                            <div className="bg-neutral-900 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-white mb-2">📢 Cookies de publicidad</h3>
                                <p className="text-neutral-400 text-sm">
                                    Permiten mostrar anuncios relevantes. Si las rechazas, seguirás viendo
                                    anuncios pero serán menos personalizados.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif text-orange-400">Gestionar tus preferencias</h2>
                        <p className="text-neutral-300 leading-relaxed">
                            Puedes cambiar tus preferencias de cookies en cualquier momento. Para hacerlo:
                        </p>
                        <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                            <li>Borra las cookies de tu navegador y vuelve a visitar la página.</li>
                            <li>Configura tu navegador para rechazar cookies de terceros.</li>
                        </ul>
                        <p className="text-neutral-300 leading-relaxed mt-4">
                            También puedes gestionar tu preferencia de anuncios personalizados de Google en: {' '}
                            <a
                                href="https://adssettings.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:text-orange-300 underline"
                            >
                                Configuración de anuncios de Google
                            </a>
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif text-orange-400">Más información</h2>
                        <p className="text-neutral-300 leading-relaxed">
                            Para más información sobre cómo tratamos tus datos, consulta nuestra {' '}
                            <Link to="/privacidad" className="text-orange-400 hover:text-orange-300 underline">
                                Política de Privacidad
                            </Link>.
                        </p>
                        <p className="text-neutral-300 leading-relaxed">
                            Si tienes preguntas, contacta con nosotros en: {' '}
                            <a href="mailto:elimpostorjuego@gmail.com" className="text-orange-400 hover:text-orange-300 underline">
                                elimpostorjuego@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
