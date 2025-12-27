import React from "react";

export function RulesContent() {
    return (
        <div className="divide-y divide-white/10 text-neutral-300">
            {/* Introducción */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">
                    Introducción
                </h3>
                <p className="text-lg leading-relaxed font-light">
                    <strong>El Impostor</strong> es un juego en el que en cada partida, los jugadores deberán descubrir quién entre ellos es el <strong>Impostor</strong>: un infiltrado que desconoce una palabra secreta que todos los demás conocen, y que debe pasar desapercibido mientras intenta deducirla para ganar.
                </p>
                <div className="mt-4 p-4 bg-neutral-900 rounded-lg">
                    <p className="text-base">
                        <strong>Recomendación:</strong> Se requiere un mínimo de 4 jugadores. Es ideal jugarlo de manera presencial o por videollamada para facilitar la ronda de pistas y el debate.
                    </p>
                </div>
            </section>

            {/* Objetivo */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">
                    Objetivo
                </h3>
                <p className="text-lg leading-relaxed mb-6 font-light">
                    El objetivo depende de tu rol. Las partidas duran un máximo de <strong className="text-orange-400">3 rondas</strong>.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-neutral-900 p-6 rounded-xl">
                        <h4 className="text-white font-semibold mb-3 text-lg">Como Amigo</h4>
                        <p className="text-neutral-400 text-base font-light">
                            Descubrir al Impostor votándolo en la ronda de eliminación. Cuantos más votos correctos acumules, más puntos ganas.
                        </p>
                    </div>
                    <div className="bg-neutral-900 p-6 rounded-xl">
                        <h4 className="text-orange-400 font-semibold mb-3 text-lg">
                            Como Impostor
                        </h4>
                        <p className="text-neutral-400 text-base font-light">
                            Sobrevivir las 3 rondas sin ser descubierto. Si sobrevives a la tercera ronda, ganas la partida.
                        </p>
                    </div>
                </div>
            </section>

            {/* Qué necesitas */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">
                    ¿Qué necesitas para jugar?
                </h3>
                <div className="space-y-4 text-lg text-neutral-300 font-light">
                    <p>
                        Solo necesitas tu <strong>móvil</strong> para mantenerte conectado a la partida. <strong>No es necesario descargar nada</strong>, juegas directamente en el navegador.
                    </p>
                    <p>
                        La comunicación de las pistas y el debate se hace de manera <strong>presencial o por videollamada</strong>.
                    </p>
                </div>
            </section>

            {/* Preparación */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">
                    Preparación
                </h3>
                <ol className="space-y-4 text-lg font-light list-decimal list-outside ml-6">
                    <li className="pl-2">
                        <strong className="text-white">Anfitrión:</strong> Un jugador entra a la web, inicia sesión y crea la partida. Elige si el Impostor tendrá una <strong>Ayuda</strong>.
                    </li>
                    <li className="pl-2">
                        <strong className="text-white">Invitación:</strong> El Anfitrión comparte el enlace de invitación con el resto de jugadores.
                    </li>
                    <li className="pl-2">
                        <strong className="text-white">Registro:</strong> Los demás jugadores entran al enlace, inician sesión y se unen automáticamente a la sala.
                    </li>
                    <li className="pl-2">
                        <strong className="text-white">Inicio:</strong> Cuando todos están en la sala, el Anfitrión comienza el juego.
                    </li>
                </ol>
            </section>

            {/* Desarrollo */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-8">
                    Desarrollo de la Partida
                </h3>
                <div className="space-y-8">
                    {/* 1 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xl shrink-0">
                            1
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">
                                Reparto de Cartas
                            </h4>
                            <p className="text-neutral-300 text-lg font-light">
                                La app asigna roles y palabra secreta. <strong>¡No le digas a nadie qué carta te ha tocado!</strong>
                            </p>
                            <ul className="list-disc ml-5 text-neutral-400 space-y-1 mt-2 font-light">
                                <li>
                                    <span className="text-neutral-300">Amigos:</span>{" "}
                                    Ven la palabra secreta.
                                </li>
                                <li>
                                    <span className="text-neutral-300">Impostor:</span>{" "}
                                    No ve la palabra. Si la ayuda está activada, verá la categoría a la que pertenece.
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 2 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xl shrink-0">
                            2
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">
                                Ronda de Pistas
                            </h4>
                            <p className="text-neutral-300 text-lg font-light">
                                Cuando sea tu turno, debes decir una pista relacionada en voz alta con la palabra. <strong>No debe ser ni muy obvia (para no ayudar al Impostor) ni muy difícil (para no parecer sospechoso).</strong>
                            </p>
                        </div>
                    </div>

                    {/* 3 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xl shrink-0">
                            3
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">
                                Debate y Votación
                            </h4>
                            <p className="text-neutral-300 text-lg font-light">
                                Una vez todos han dado su pista, se inicia la votación.
                                Cuando todos votan, se revela el resultado.
                            </p>
                        </div>
                    </div>

                    {/* 4 */}
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xl shrink-0">
                            4
                        </div>
                        <div className="space-y-2 pt-1">
                            <h4 className="text-xl font-semibold text-white">
                                Resolución
                            </h4>
                            <p className="text-neutral-300 text-lg font-light">
                                El jugador con más votos es <strong>eliminado de la partida</strong> y ya no juega la siguiente ronda.
                            </p>
                            <ul className="list-disc ml-5 text-neutral-400 space-y-1 mt-2 font-light">
                                <li>
                                    <strong>Si se elimina al Impostor:</strong> La partida termina y el Impostor pierde.
                                </li>
                                <li>
                                    <strong>Si se elimina a un Amigo:</strong> El Impostor sobrevive, gana puntos y la partida continúa una ronda más.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Puntuación */}
            <section className="py-12 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-serif text-orange-400 mb-6">
                    Sistema de Puntuación
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-neutral-900 p-6 rounded-xl">
                        <h4 className="text-white font-semibold mb-3 text-lg">
                            Amigos
                        </h4>
                        <ul className="text-neutral-300 space-y-2 font-light">
                            <li>
                                • <strong>+2 puntos</strong> para cada jugador que vote correctamente al Impostor.
                            </li>
                        </ul>
                        <p className="text-neutral-500 text-sm mt-4">
                            Máximo posible: 6 puntos (2 por ronda)
                        </p>
                    </div>
                    <div className="bg-neutral-900 p-6 rounded-xl">
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
                        <p className="text-neutral-500 text-sm mt-4">
                            Máximo posible: 7 puntos
                        </p>
                    </div>
                </div>
                <div className="mt-6 bg-neutral-900 p-4 rounded-lg text-neutral-400 text-sm">
                    <strong className="text-orange-400">Empates:</strong> Si hay empate
                    en la votación, nadie es eliminado y el Impostor recibe sus puntos
                    de esa ronda.
                </div>
            </section>
        </div>
    );
}
