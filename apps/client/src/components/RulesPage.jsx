import React from "react";
import { Button } from "./ui/Button";
import heroImg from "../assets/impostor-home.jpg";

export function RulesPage() {
    return (
        <div
            className="bg-neutral-950 text-white min-h-[100dvh] font-sans flex flex-col select-text"
            style={{ userSelect: "text", WebkitUserSelect: "text" }}
        >
            {/* Navbar Fixed */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
                <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src={heroImg} alt="Logo El Impostor" className="w-8 h-8 rounded-full" />
                    <span className="text-xl font-normal font-serif tracking-wide text-neutral-100">
                        El Impostor
                    </span>
                </a>
                <div>
                    <Button
                        onClick={() => (window.location.href = "/")}
                        variant="primary"
                        size="sm"
                        className="w-auto !px-6 !py-1 !h-9 text-sm rounded-full"
                    >
                        Jugar Ahora
                    </Button>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1 pt-24 pb-12 px-6">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif text-white">
                            Reglas del Juego
                        </h2>
                        <p className="text-xl text-neutral-400 font-normal">
                            Aprende a detectar al Impostor o a engañar a todos sin ser descubierto.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* INTRODUCCIÓN */}
                        <section className="space-y-4">
                            <h3 className="text-2xl text-orange-500 font-serif">Introducción</h3>
                            <p className="text-neutral-300 text-lg leading-relaxed">
                                <strong className="text-white">El Impostor</strong> es un juego de
                                deducción social para 4 o más jugadores que combina elementos
                                digitales (aplicación web) con interacción presencial o por
                                videollamada. En cada partida, los jugadores deberán descubrir quién
                                entre ellos es el{" "}
                                <strong className="text-orange-400">Impostor</strong>: un infiltrado
                                que desconoce una palabra secreta que todos los demás conocen, y que
                                debe pasar desapercibido mientras intenta deducirla.
                            </p>
                        </section>

                        {/* COMPONENTES */}
                        <section className="space-y-4">
                            <h3 className="text-2xl text-orange-500 font-serif">Componentes</h3>
                            <ul className="space-y-3 text-neutral-300 text-lg">
                                <li className="flex gap-3">
                                    <span className="text-orange-500 shrink-0">▸</span>
                                    <span>
                                        <strong>Aplicación web</strong>: Gestiona el reparto de
                                        cartas, roles, votaciones y puntuación.
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-orange-500 shrink-0">▸</span>
                                    <span>
                                        <strong>Dispositivos</strong>: Un dispositivo con conexión a
                                        internet por jugador.
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-orange-500 shrink-0">▸</span>
                                    <span>
                                        <strong>Espacio de juego</strong>: Comunicación oral
                                        (presencial o videollamada).
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* PREPARACIÓN */}
                        <section className="space-y-4">
                            <h3 className="text-2xl text-orange-500 font-serif">Preparación</h3>
                            <ol className="space-y-4 text-neutral-300 text-lg list-decimal list-outside ml-6">
                                <li className="pl-2">
                                    <strong className="text-white">Acceso:</strong> Todos acceden a
                                    la web e inician sesión.
                                </li>
                                <li className="pl-2">
                                    <strong className="text-white">Creación:</strong> Un Anfitrión
                                    crea la partida y configura si el Impostor tendrá pista de
                                    categoría.
                                </li>
                                <li className="pl-2">
                                    <strong className="text-white">Unión:</strong> El resto se une
                                    con el código o enlace compartido.
                                </li>
                                <li className="pl-2">
                                    <strong className="text-white">Inicio:</strong> El Anfitrión
                                    comienza el juego cuando todos están listos.
                                </li>
                            </ol>
                        </section>

                        {/* OBJETIVO */}
                        <section className="space-y-4">
                            <h3 className="text-2xl text-orange-500 font-serif">Objetivo</h3>
                            <p className="text-neutral-300 text-lg leading-relaxed">
                                Cada partida tiene <strong className="text-orange-400">3 rondas</strong> con el mismo Impostor.
                                El objetivo depende de tu rol:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-neutral-900 p-5 rounded-xl">
                                    <h4 className="text-white font-semibold mb-2">Como Amigo</h4>
                                    <p className="text-neutral-400">
                                        Identificar y expulsar al Impostor antes de que termine la ronda 3.
                                        Gana el <strong className="text-white">amigo con más puntos</strong>.
                                    </p>
                                </div>
                                <div className="bg-neutral-900 p-5 rounded-xl">
                                    <h4 className="text-orange-400 font-semibold mb-2">
                                        Como Impostor
                                    </h4>
                                    <p className="text-neutral-400">
                                        Sobrevivir las 3 rondas sin ser descubierto. Si lo logras, <strong className="text-orange-400">ganas automáticamente</strong>.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* DESARROLLO */}
                        <section className="space-y-6">
                            <h3 className="text-2xl text-orange-500 font-serif">
                                Desarrollo de la Partida
                            </h3>

                            <div className="space-y-6">
                                {/* 1 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">
                                        1
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-semibold text-white">
                                            Reparto de Cartas
                                        </h4>
                                        <p className="text-neutral-300">
                                            La app asigna roles y palabra secreta.
                                        </p>
                                        <ul className="list-disc ml-5 text-neutral-400 space-y-1">
                                            <li>
                                                <span className="text-neutral-400">Amigos:</span>{" "}
                                                Ven la palabra secreta.
                                            </li>
                                            <li>
                                                <span className="text-neutral-400">Impostor:</span>{" "}
                                                No ve la palabra (puede ver categoría).
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 2 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">
                                        2
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-semibold text-white">
                                            Ronda de Pistas
                                        </h4>
                                        <p className="text-neutral-300">
                                            Cada jugador dice una pista relacionada con la palabra
                                            en orden. No deben ser ni muy obvias ni muy difíciles.
                                        </p>
                                    </div>
                                </div>

                                {/* 3 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">
                                        3
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-semibold text-white">
                                            Votación
                                        </h4>
                                        <p className="text-neutral-300">
                                            En cualquier momento se puede votar al sospechoso.
                                            Cuando todos votan, se revela el resultado.
                                        </p>
                                    </div>
                                </div>

                                {/* 4 */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-lg shrink-0 mt-1">
                                        4
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-semibold text-white">
                                            Resolución
                                        </h4>
                                        <p className="text-neutral-300">
                                            Si el Impostor es expulsado, gana el <strong className="text-white">amigo con más puntos</strong>.
                                            Si un amigo es expulsado o hay empate, el Impostor recibe puntos y sigue la partida.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PUNTUACIÓN */}
                        <section className="space-y-4">
                            <h3 className="text-2xl text-orange-500 font-serif">Puntuación</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-neutral-900 p-5 rounded-xl">
                                    <h4 className="text-white font-semibold mb-3 text-lg">
                                        Amigos
                                    </h4>
                                    <ul className="text-neutral-300 space-y-2">
                                        <li>
                                            • <strong>+2 puntos</strong> por votar correctamente al
                                            Impostor (individual).
                                        </li>
                                    </ul>
                                    <p className="text-neutral-500 text-sm mt-3">
                                        Máximo posible: 6 puntos (2 por ronda)
                                    </p>
                                </div>
                                <div className="bg-orange-900/10 p-5 rounded-xl">
                                    <h4 className="text-orange-400 font-semibold mb-3 text-lg">
                                        Impostor
                                    </h4>
                                    <ul className="text-neutral-300 space-y-2">
                                        <li>
                                            • <strong>+3 puntos</strong> por sobrevivir ronda 1.
                                        </li>
                                        <li>
                                            • <strong>+2 puntos</strong> por sobrevivir ronda 2.
                                        </li>
                                        <li>
                                            • <strong>+2 puntos</strong> por ganar ronda 3.
                                        </li>
                                    </ul>
                                    <p className="text-neutral-500 text-sm mt-3">
                                        Máximo posible: 7 puntos
                                    </p>
                                </div>
                            </div>
                            <div className="bg-neutral-800/50 p-4 rounded-lg text-neutral-400 text-sm">
                                <strong className="text-orange-400">Empates:</strong> Si hay empate en la votación,
                                nadie es eliminado y el Impostor recibe sus puntos de esa ronda.
                            </div>
                        </section>
                    </div>

                    <div className="pt-12 text-center">
                        <Button
                            onClick={() => (window.location.href = "/")}
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto px-8 bg-orange-600 hover:bg-orange-500 text-white border-none shadow-lg h-14 text-lg font-bold transform hover:scale-105 transition-all duration-300 rounded-full flex items-center justify-center mx-auto"
                        >
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
