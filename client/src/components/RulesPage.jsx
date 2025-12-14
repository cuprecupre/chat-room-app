import React from 'react';
import { Button } from './ui/Button';
import heroImg from '../assets/impostor-home.png';

export function RulesPage() {
    return (
        <div className="bg-neutral-950 text-white min-h-[100dvh] font-sans flex flex-col">
            {/* Header */}
            <header className="py-6 px-6 border-b border-white/10 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src={heroImg} alt="Logo" className="w-10 h-10 rounded-full" />
                        <h1 className="text-xl font-bold font-serif tracking-wide text-neutral-100">El Impostor</h1>
                    </a>

                </div>
            </header>

            {/* Content */}
            <main className="flex-1 py-12 px-6">
                <div className="max-w-3xl mx-auto space-y-12">

                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-bold font-serif text-white">Reglas del Juego</h2>
                        <p className="text-xl text-neutral-400">Aprende a detectar al Impostor o a engañar a todos sin ser descubierto.</p>
                    </div>

                    <div className="space-y-12">
                        {/* INTRODUCCIÓN */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-bold text-orange-500 font-serif border-b border-white/10 pb-2">Introducción</h3>
                            <p className="text-neutral-300 text-lg leading-relaxed">
                                <strong className="text-white">El Impostor</strong> es un juego de deducción social para 4 o más jugadores que combina elementos digitales
                                (aplicación web) con interacción presencial o por videollamada. En cada partida, los jugadores deberán descubrir quién entre ellos
                                es el <strong className="text-orange-400">Impostor</strong>: un infiltrado que desconoce una palabra secreta que todos los demás conocen,
                                y que debe pasar desapercibido mientras intenta deducirla.
                            </p>
                        </section>

                        {/* COMPONENTES */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-bold text-orange-500 font-serif border-b border-white/10 pb-2">Componentes</h3>
                            <ul className="space-y-3 text-neutral-300 text-lg">
                                <li className="flex gap-3">
                                    <span className="text-orange-500 shrink-0">▸</span>
                                    <span><strong>Aplicación web</strong>: Gestiona el reparto de cartas, roles, votaciones y puntuación.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-orange-500 shrink-0">▸</span>
                                    <span><strong>Dispositivos</strong>: Un dispositivo con conexión a internet por jugador.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-orange-500 shrink-0">▸</span>
                                    <span><strong>Espacio de juego</strong>: Comunicación oral (presencial o videollamada).</span>
                                </li>
                            </ul>
                        </section>

                        {/* PREPARACIÓN */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-bold text-orange-500 font-serif border-b border-white/10 pb-2">Preparación</h3>
                            <ol className="space-y-4 text-neutral-300 text-lg list-decimal list-outside ml-6">
                                <li className="pl-2">
                                    <strong className="text-white">Acceso:</strong> Todos acceden a la web e inician sesión.
                                </li>
                                <li className="pl-2">
                                    <strong className="text-white">Creación:</strong> Un Anfitrión crea la partida y configura si el Impostor tendrá pista de categoría.
                                </li>
                                <li className="pl-2">
                                    <strong className="text-white">Unión:</strong> El resto se une con el código o enlace compartido.
                                </li>
                                <li className="pl-2">
                                    <strong className="text-white">Inicio:</strong> El Anfitrión comienza el juego cuando todos están listos.
                                </li>
                            </ol>
                        </section>

                        {/* OBJETIVO */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-bold text-orange-500 font-serif border-b border-white/10 pb-2">Objetivo</h3>
                            <p className="text-neutral-300 text-lg leading-relaxed">
                                Gana el primero en alcanzar <strong className="text-yellow-400">15 puntos</strong>. Si tras 3 partidas nadie llega, gana quien tenga más puntos.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-neutral-900 border border-white/10 p-5 rounded-xl">
                                    <h4 className="text-green-400 font-bold mb-2">Como Amigo</h4>
                                    <p className="text-neutral-400">Identificar y expulsar al Impostor para proteger la palabra secreta.</p>
                                </div>
                                <div className="bg-neutral-900 border border-white/10 p-5 rounded-xl">
                                    <h4 className="text-orange-400 font-bold mb-2">Como Impostor</h4>
                                    <p className="text-neutral-400">Fingir conocer la palabra, pasar desapercibido y sobrevivir.</p>
                                </div>
                            </div>
                        </section>

                        {/* DESARROLLO */}
                        <section className="space-y-6">
                            <h3 className="text-2xl font-bold text-orange-500 font-serif border-b border-white/10 pb-2">Desarrollo de la Partida</h3>

                            <div className="space-y-6">
                                {/* 1 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">1</div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-bold text-white">Reparto de Cartas</h4>
                                        <p className="text-neutral-300">La app asigna roles y palabra secreta.</p>
                                        <ul className="list-disc ml-5 text-neutral-400 space-y-1">
                                            <li><strong>Amigos:</strong> Ven la palabra secreta.</li>
                                            <li><strong>Impostor:</strong> No ve la palabra (puede ver categoría).</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 2 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">2</div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-bold text-white">Ronda de Pistas</h4>
                                        <p className="text-neutral-300">Cada jugador dice una pista relacionada con la palabra en orden. No deben ser ni muy obvias ni muy difíciles.</p>
                                    </div>
                                </div>

                                {/* 3 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">3</div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-bold text-white">Votación</h4>
                                        <p className="text-neutral-300">En cualquier momento se puede votar al sospechoso. Cuando todos votan, se revela el resultado.</p>
                                    </div>
                                </div>

                                {/* 4 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">4</div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-bold text-white">Resolución</h4>
                                        <p className="text-neutral-300">Si el Impostor es expulsado, ganan los Amigos. Si se expulsa a un Amigo, el Impostor gana puntos y sigue la partida (hasta 3 rondas).</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PUNTUACIÓN */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-bold text-orange-500 font-serif border-b border-white/10 pb-2">Puntuación</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-green-900/10 border border-green-500/20 p-5 rounded-xl">
                                    <h4 className="text-green-400 font-bold mb-3 text-lg">Amigos</h4>
                                    <ul className="text-neutral-300 space-y-2">
                                        <li>• <strong>+1 punto</strong> por votar correctamente al Impostor.</li>
                                        <li>• <strong>+1 punto</strong> extra si el Impostor es expulsado.</li>
                                    </ul>
                                </div>
                                <div className="bg-orange-900/10 border border-orange-500/20 p-5 rounded-xl">
                                    <h4 className="text-orange-400 font-bold mb-3 text-lg">Impostor</h4>
                                    <ul className="text-neutral-300 space-y-2">
                                        <li>• <strong>+2 puntos</strong> por sobrevivir ronda 1.</li>
                                        <li>• <strong>+3 puntos</strong> por sobrevivir ronda 2.</li>
                                        <li>• <strong>+4 puntos</strong> por ganar (ronda 3 o final).</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                    </div>


                    <div className="pt-12 text-center">
                        <Button onClick={() => window.location.href = '/'} variant="primary" size="lg" className="w-full sm:w-auto px-8 bg-orange-600 hover:bg-orange-500 text-white border-none shadow-lg h-14 text-lg font-bold transform hover:scale-105 transition-all duration-300 rounded-full flex items-center justify-center gap-3 mx-auto">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.35 11.1H12V15.3H17.5C17.2 16.2 16.5 17.6 15.1 18.5C14.2 19.1 13.1 19.4 12 19.4C9.1 19.4 6.7 17.5 5.8 14.9C5.6 14.3 5.5 13.7 5.5 13C5.5 12.3 5.6 11.7 5.8 11.1C6.7 8.5 9.1 6.6 12 6.6C13.6 6.6 14.9 7.2 15.8 8l3.1-3.1C17.2 3.3 14.9 2.4 12 2.4C8 2.4 4.5 4.7 2.8 8.1C2 9.6 1.6 11.3 1.6 13C1.6 14.7 2 16.4 2.8 17.9C4.5 21.3 8 23.6 12 23.6C14.8 23.6 17.1 22.7 18.8 21.1C20.6 19.4 21.6 17 21.6 14.1C21.6 13.1 21.5 12.1 21.35 11.1Z" fill="white" />
                            </svg>
                            Empezar Partida Gratis
                        </Button>
                    </div>

                </div>
            </main>

            <footer className="py-8 text-center text-neutral-500 text-sm border-t border-white/5">
                <p>© {new Date().getFullYear()} El Impostor. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
