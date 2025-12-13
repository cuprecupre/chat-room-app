import React from 'react';
import { Modal } from './ui/Modal';

export function InstructionsModal({ isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Instrucciones">
            <div className="max-w-none select-text space-y-6" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>

                {/* INTRODUCCIÓN */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Introducción</h3>
                    <p className="text-neutral-300 text-base leading-relaxed">
                        <strong className="text-white">El Impostor</strong> es un juego de deducción social para 4 o más jugadores que combina elementos digitales
                        (aplicación web) con interacción presencial o por videollamada. En cada partida, los jugadores deberán descubrir quién entre ellos
                        es el <strong className="text-orange-400">Impostor</strong>: un infiltrado que desconoce una palabra secreta que todos los demás conocen,
                        y que debe pasar desapercibido mientras intenta deducirla.
                    </p>
                </section>

                <div className="h-px bg-white/10" />

                {/* COMPONENTES */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Componentes</h3>
                    <ul className="space-y-2 text-neutral-300 text-base">
                        <li className="flex gap-2">
                            <span className="text-orange-400 shrink-0">▸</span>
                            <span><strong>Aplicación web</strong>: Gestiona el reparto de cartas, roles, votaciones y puntuación.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-orange-400 shrink-0">▸</span>
                            <span><strong>Dispositivos con conexión a internet</strong>: Un dispositivo por jugador.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-orange-400 shrink-0">▸</span>
                            <span><strong>Espacio de juego</strong>: Los jugadores deben poder comunicarse oralmente (presencialmente o por videollamada).</span>
                        </li>
                    </ul>
                </section>

                <div className="h-px bg-white/10" />

                {/* PREPARACIÓN */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Preparación</h3>
                    <ol className="space-y-3 text-neutral-300 text-base ml-5 list-decimal list-outside">
                        <li>
                            <strong className="text-white">Acceso a la aplicación:</strong> Todos los jugadores deben acceder a la aplicación web desde sus dispositivos
                            e iniciar sesión.
                        </li>
                        <li>
                            <strong className="text-white">Creación de la partida:</strong> Un jugador actúa como <strong>Anfitrión</strong> y crea una nueva partida.
                            Durante la creación, debe elegir si el Impostor recibirá una <strong>pista orientativa</strong> (categoría a la que pertenece la palabra secreta)
                            o jugará completamente a ciegas.
                        </li>
                        <li>
                            <strong className="text-white">Unirse a la partida:</strong> El Anfitrión comparte el código de partida o enlace con el resto de jugadores,
                            que se unen a la partida.
                        </li>
                        <li>
                            <strong className="text-white">Inicio del juego:</strong> Cuando todos estén listos, el Anfitrión pulsa el botón "Comenzar juego".
                        </li>
                    </ol>
                </section>

                <div className="h-px bg-white/10" />

                {/* OBJETIVO DEL JUEGO */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Objetivo del Juego</h3>
                    <div className="space-y-4">
                        <p className="text-neutral-300 text-base leading-relaxed">
                            Un juego completo se desarrolla a lo largo de <strong>varias partidas consecutivas</strong>. El primer jugador en alcanzar
                            <strong className="text-yellow-400"> 15 puntos</strong> gana. Si tras <strong>3 partidas</strong> nadie ha alcanzado ese total,
                            gana quien tenga la mayor puntuación acumulada.
                        </p>
                        <div className="bg-neutral-800/50 p-4 rounded-lg space-y-2">
                            <p className="text-neutral-200 text-sm">
                                <strong className="text-green-400">Como Amigo:</strong> Tu objetivo es identificar y expulsar al Impostor para ganar puntos.
                            </p>
                            <p className="text-neutral-200 text-sm">
                                <strong className="text-orange-400">Como Impostor:</strong> Tu objetivo es permanecer oculto el mayor tiempo posible,
                                fingiendo conocer la palabra secreta sin delatar que la desconoces.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-white/10" />

                {/* DESARROLLO DE UNA PARTIDA */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-4">Desarrollo de una Partida</h3>

                    <div className="space-y-5">
                        {/* 1. Reparto de Cartas */}
                        <div className="bg-neutral-800/30 p-4 rounded-lg border border-orange-500/20">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-sm">1</span>
                                Reparto de Cartas
                            </h4>
                            <div className="ml-9 space-y-3 text-neutral-300 text-base">
                                <p>
                                    Al inicio de cada partida, la aplicación selecciona aleatoriamente una <strong className="text-white">palabra secreta</strong> y
                                    asigna el rol de <strong className="text-orange-400">Impostor</strong> a un jugador. El resto son <strong className="text-white">Amigos</strong>.
                                </p>
                                <p>
                                    <strong className="text-white">Cada jugador recibe su carta digitalmente</strong> en su dispositivo. Esta carta es
                                    <strong className="text-yellow-400"> privada y confidencial</strong>.
                                </p>
                                <ul className="space-y-2 ml-4">
                                    <li className="flex gap-2">
                                        <span className="text-green-400 shrink-0">●</span>
                                        <span>
                                            <strong>Los Amigos</strong> ven la palabra secreta completa (por ejemplo: <em>"Lavadora"</em>).
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">●</span>
                                        <span>
                                            <strong>El Impostor</strong> NO ve la palabra. Dependiendo de la configuración elegida por el Anfitrión, puede recibir
                                            una categoría orientativa (por ejemplo: <em>"Electrodomésticos"</em>) o no recibir ninguna ayuda.
                                        </span>
                                    </li>
                                </ul>
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-sm text-red-300 italic">
                                        <strong>⚠ IMPORTANTE:</strong> Cada jugador debe consultar su carta en privado, sin mostrarla ni revelar su rol a los demás.
                                        Mantener el secreto es fundamental para el desarrollo del juego.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Ronda de Pistas */}
                        <div className="bg-neutral-800/30 p-4 rounded-lg border border-orange-500/20">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-sm">2</span>
                                Ronda de Pistas (Fase Oral)
                            </h4>
                            <div className="ml-9 space-y-3 text-neutral-300 text-base">
                                <p>
                                    Los jugadores realizan una <strong className="text-white">ronda de pistas orales</strong>. La aplicación indica qué jugador debe
                                    comenzar (en la primera partida es el Anfitrión; en partidas posteriores, el turno rota). A partir del jugador inicial,
                                    <strong> cada jugador da una pista en voz alta</strong>, siguiendo el <strong>sentido horario</strong> (o el orden que el grupo acuerde).
                                </p>
                                <div className="bg-white/5 p-3 rounded-lg space-y-2">
                                    <p className="text-sm text-neutral-200">
                                        <strong className="text-green-400">Estrategia para los Amigos:</strong>
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        Debes dar una pista que demuestre a los demás Amigos que <strong>conoces la palabra</strong>, pero sin ser tan específica
                                        que permita al Impostor deducirla fácilmente. La astucia es clave: una pista demasiado obvia facilita el trabajo del Impostor;
                                        una pista demasiado vaga levanta sospechas.
                                    </p>
                                    <p className="text-xs text-neutral-400 italic mt-2">
                                        Ejemplo: Si la palabra es "Lavadora", una buena pista sería <em>"Ciclos"</em> o <em>"Tambor"</em>.
                                        Una mala pista sería <em>"Electrodoméstico de la colada"</em> (demasiado obvio).
                                    </p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg space-y-2">
                                    <p className="text-sm text-neutral-200">
                                        <strong className="text-orange-400">Estrategia para el Impostor:</strong>
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        Debes <strong>escuchar atentamente</strong> las pistas de los Amigos e intentar deducir la palabra secreta.
                                        Cuando sea tu turno, da una pista <strong>genérica pero creíble</strong> que pueda encajar con las anteriores,
                                        sin delatar que desconoces la palabra exacta. Si tienes la categoría, úsala para orientar tu pista.
                                    </p>
                                    <p className="text-xs text-neutral-400 italic mt-2">
                                        Ejemplo: Si escuchas pistas como "Ciclos" y "Agua", y tienes la categoría "Electrodomésticos", podrías decir <em>"Ruidoso"</em>
                                        o <em>"Necesario en casa"</em>.
                                    </p>
                                </div>
                                <p className="text-sm text-neutral-400 italic">
                                    <strong>Nota técnica:</strong> La aplicación NO gestiona los turnos de habla en tiempo real. Los jugadores organizan
                                    el orden oralmente entre ellos. La app solo indica quién debe empezar.
                                </p>
                            </div>
                        </div>

                        {/* 3. Votación */}
                        <div className="bg-neutral-800/30 p-4 rounded-lg border border-orange-500/20">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-sm">3</span>
                                Votación
                            </h4>
                            <div className="ml-9 space-y-3 text-neutral-300 text-base">
                                <p>
                                    <strong className="text-white">En cualquier momento de la partida</strong>, cada jugador puede votar en la aplicación
                                    a quien considere que es el Impostor.
                                </p>
                                <p className="text-sm">
                                    <strong>Reglas de votación:</strong>
                                </p>
                                <ul className="space-y-2 ml-4 text-sm">
                                    <li className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">▸</span>
                                        <span>No puedes votarte a ti mismo.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">▸</span>
                                        <span>No puedes votar a jugadores que ya han sido eliminados en esta partida.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">▸</span>
                                        <span>
                                            Puedes <strong>cambiar tu voto</strong> en cualquier momento, pero solo <strong>antes de que el último jugador vote</strong>.
                                            Una vez todos han votado, los votos se <strong>bloquean y procesan</strong> automáticamente.
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-400 shrink-0">▸</span>
                                        <span>
                                            La aplicación muestra <strong>quién ya ha votado</strong>, pero NO revela <strong>a quién votó cada uno</strong>.
                                            La votación es secreta hasta el final.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* 4. Expulsión y Resolución */}
                        <div className="bg-neutral-800/30 p-4 rounded-lg border border-orange-500/20">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-sm">4</span>
                                Expulsión y Resolución
                            </h4>
                            <div className="ml-9 space-y-3 text-neutral-300 text-base">
                                <p>
                                    Cuando todos los jugadores activos han emitido su voto, se revela el resultado:
                                </p>
                                <div className="space-y-3">
                                    <div className="flex gap-3 items-start">
                                        <span className="text-green-400 font-bold text-xl shrink-0">✓</span>
                                        <div>
                                            <p className="text-white font-semibold">El jugador más votado era el Impostor</p>
                                            <p className="text-sm">
                                                La partida <strong>termina inmediatamente</strong>. Los Amigos ganan y se reparten puntos (ver Sistema de Puntuación).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <span className="text-red-400 font-bold text-xl shrink-0">✗</span>
                                        <div>
                                            <p className="text-white font-semibold">El jugador más votado era un Amigo</p>
                                            <p className="text-sm mb-2">
                                                El jugador expulsado queda <strong>fuera de esta partida</strong> (no puede dar más pistas ni votar).
                                                Se inicia una <strong>nueva ronda de pistas</strong> con los jugadores restantes.
                                            </p>
                                            <p className="text-xs text-neutral-400 italic">
                                                Cada partida puede tener un máximo de <strong>3 rondas</strong>. Si tras la tercera ronda no se ha expulsado al Impostor,
                                                <strong className="text-orange-400"> gana el Impostor</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <span className="text-yellow-500 font-bold text-xl shrink-0">—</span>
                                        <div>
                                            <p className="text-white font-semibold">Empate en la votación</p>
                                            <p className="text-sm">
                                                Si hay empate (dos o más jugadores con el mismo número de votos), <strong>nadie es expulsado</strong>.
                                                Se juega una nueva ronda de pistas sin otorgar puntos al Impostor por esta ronda.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-white/10" />

                {/* SISTEMA DE PUNTUACIÓN */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Sistema de Puntuación</h3>
                    <div className="space-y-4">
                        <p className="text-neutral-300 text-base">
                            Los puntos se acumulan entre partidas. El primer jugador en alcanzar 15 puntos gana el juego completo.
                        </p>
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                            <h4 className="text-green-400 font-bold mb-2">Puntuación para los Amigos</h4>
                            <ul className="space-y-1 text-neutral-300 text-sm ml-4">
                                <li className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span><strong>+1 punto</strong> por cada ronda en la que <strong>votaste correctamente al Impostor</strong> (incluso si no fue expulsado).</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span><strong>+1 punto adicional</strong> si el Impostor fue <strong>expulsado</strong> (ganáis la partida).</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                            <h4 className="text-orange-400 font-bold mb-2">Puntuación para el Impostor</h4>
                            <ul className="space-y-1 text-neutral-300 text-sm ml-4">
                                <li className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span><strong>+2 puntos</strong> por sobrevivir la <strong>primera ronda</strong> (si hubo expulsión de un Amigo).</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span><strong>+3 puntos</strong> por sobrevivir la <strong>segunda ronda</strong> (si hubo expulsión de un Amigo).</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="shrink-0">•</span>
                                    <span><strong>+4 puntos</strong> por sobrevivir la <strong>tercera ronda</strong> o llegar al final sin ser descubierto.</span>
                                </li>
                                <li className="flex gap-2 text-xs text-neutral-400 italic">
                                    <span className="shrink-0">•</span>
                                    <span>Si una ronda termina en empate, no se otorgan puntos y se juega otra ronda.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-white/10" />

                {/* REGLAS ADICIONALES */}
                <section>
                    <h3 className="text-xl font-bold text-orange-400 mb-3">Reglas Adicionales</h3>
                    <ul className="space-y-3 text-neutral-300 text-base">
                        <li className="flex gap-2">
                            <span className="text-orange-400 shrink-0">▸</span>
                            <span>
                                <strong className="text-white">Jugadores eliminados:</strong> Un jugador eliminado en una partida <strong>vuelve a jugar</strong>
                                en la siguiente partida. La eliminación solo afecta a la partida en curso.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-orange-400 shrink-0">▸</span>
                            <span>
                                <strong className="text-white">Desconexiones:</strong> Si un jugador se desconecta, puede <strong>reingresar</strong> a la partida.
                                Sus puntos acumulados se mantienen. La partida continúa sin esperar.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-orange-400 shrink-0">▸</span>
                            <span>
                                <strong className="text-white">Fin del juego:</strong> El juego termina cuando un jugador alcanza 15 puntos o cuando se completan
                                3 partidas sin que nadie llegue a ese total (en cuyo caso gana quien tenga más puntos).
                            </span>
                        </li>
                    </ul>
                </section>

            </div>
        </Modal>
    );
}
