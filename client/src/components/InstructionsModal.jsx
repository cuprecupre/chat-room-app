import React from 'react';
import { Modal } from './ui/Modal';

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instrucciones">
      <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
        
        {/* ¿Qué es El impostor? */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">¿Qué es <em>El impostor</em>?</h3>
          <p className="text-neutral-300 leading-relaxed">
            <em>El impostor</em> es un juego social de deducción que combina una <strong>app web</strong> con dinámica <strong>presencial</strong>.
          </p>
          <p className="text-neutral-300 leading-relaxed mt-3">
            En cada <strong>ronda</strong>, un jugador es el <strong>Impostor</strong> y el resto son <strong>Amigos.</strong> Se reparten las cartas. Los Amigos ven una <strong>palabra secreta</strong>; el Impostor no la conoce, pero recibe <strong>una pista orientativa</strong>.
            Cada jugador solo ha visto su carta y debe desconfiar de todo lo que sucede a su alrededor.
          </p>
          <p className="text-neutral-300 leading-relaxed mt-3">
            A partir de <strong>pistas dichas en voz alta</strong> y <strong>votaciones</strong> en la app, el grupo intentará descubrir al impostor antes de que se salga con la suya.
          </p>
        </section>

        {/* Qué necesitas */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Qué necesitas</h3>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>Un dispositivo</strong> con conexión por jugador.</li>
            <li><strong>Espacio para jugar</strong> juntos (mesa/sofá) o <strong>videollamada</strong>.</li>
          </ul>
        </section>

        {/* Componentes del juego */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Componentes del juego</h3>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>App web</strong>: gestiona <strong>roles, cartas, votos y puntos</strong>.</li>
            <li><strong>Interacción presencial</strong>: <strong>turnos y pistas</strong> se realizan <strong>fuera de la app</strong>, hablando en voz alta.</li>
            <li><strong>Jugadores</strong>: Mínimo 4. Sin límite.</li>
          </ul>
        </section>

        {/* Objetivo del juego */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Objetivo del juego</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">🎯 Como jugador</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>Amigo</strong>: descubrir quién es el impostor y ganar puntos por ello.</li>
            <li><strong>Impostor</strong>: <strong>fingir</strong> que conoces la palabra secreta para <strong>no ser descubierto y ganar puntos por ello.</strong></li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">🏆 Para ganar la partida</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Acumula <strong>15 puntos</strong> a lo largo de varias rondas.</li>
            <li>La partida continúa hasta que <strong>alguien alcance</strong> ese total o hasta que se juegue el número máximo de rondas.</li>
            <li>El número máximo de rondas será equivalente al número de jugadores que iniciaron la partida multiplicado por dos. (Ejemplo: Si la partida la inician 5 jugadores el número máximo de rondas es 10).</li>
          </ul>
        </section>

        {/* Preparación */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Preparación</h3>
          <ol className="list-decimal list-inside space-y-2 text-neutral-300">
            <li>Abre la <strong>app web</strong> en tu dispositivo.</li>
            <li><strong>Inicia sesión</strong>.</li>
            <li>Un jugador crea la partida como <strong>anfitrión</strong> y comparte <strong>enlace o código con el resto de jugadores.</strong></li>
            <li>Con todos conectados, el anfitrión pulsa <strong>"Iniciar ronda"</strong>.</li>
          </ol>
        </section>

        {/* Desarrollo del juego */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Desarrollo del juego</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">🔄 Estructura general</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Una <strong>partida</strong> se compone de <strong>varias rondas</strong>.</li>
            <li>Cada <strong>ronda</strong> puede tener <strong>hasta 3 vueltas</strong>.</li>
            <li>En cada <strong>vuelta</strong>, todos los jugadores realizan <strong>su turno oral</strong> para dar <strong>una pista</strong>.</li>
          </ul>
        </section>

        {/* Roles y cartas */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Roles y cartas</h3>
          <p className="text-neutral-300 leading-relaxed mb-3">
            Al empezar una ronda, cada jugador recibe una carta en la app:
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>🟦 <strong>Amigos</strong>: ven la <strong>palabra secreta</strong> (ej.: "Lavadora").</li>
            <li>🟥 <strong>Impostor</strong>: recibe <strong>una pista orientativa</strong> (ej.: "Electrodomésticos"). <strong>No</strong> ve la palabra exacta.</li>
          </ul>
          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-neutral-400 italic">
              Tu carta es privada: no la muestres ni reveles tu rol.
            </p>
          </div>
        </section>

        {/* Dinámica presencial */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Dinámica presencial</h3>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>La app <strong>no</strong> gestiona turnos.</li>
            <li>Los <strong>turnos</strong> se organizan <strong>en persona</strong>: cada jugador dice <strong>una pista breve</strong> en voz alta cuando el grupo lo indique.</li>
            <li>El jugador que empieza la primera ronda es el anfitrión, a partir de ese momento los turnos van en sentido horario.</li>
            <li>Cuando se lanza una nueva ronda el jugador que comienza es el que está en el sentido horario del anfitrión.</li>
          </ul>
        </section>

        {/* Una ronda, paso a paso */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Una ronda, paso a paso</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">1) Primera vuelta de pistas</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300 mb-3">
            <li>En orden (sentido horario), <strong>cada jugador</strong> da <strong>una pista</strong> relacionada con la palabra secreta.</li>
            <li>Si eres amigo: La pista que das debe ayudarte a que tus amigos sepan que eres amigo pero <strong>sin delatar</strong> la palabra.</li>
            <li>Si eres impostor: improvisa una pista <strong>creíble</strong> sin conocer la palabra exacta.</li>
          </ul>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg mb-4">
            <p className="text-sm font-semibold text-neutral-200 mb-1">Ejemplo</p>
            <p className="text-sm text-neutral-300">
              Palabra: "Lavadora" → pistas posibles: "ciclo", "espuma", "tela", "sonido".
            </p>
            <p className="text-sm text-neutral-300 mt-1">
              El impostor podría arriesgar con "hogar" para sonar verosímil.
            </p>
          </div>

          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">2) Votación (abierta durante la ronda)</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>En cualquier momento</strong> de la ronda, puedes <strong>votar en la app</strong> a quien creas impostor.</li>
            <li><strong>No</strong> puedes votarte a ti mismo.</li>
            <li>La app <strong>no</strong> muestra por quién votó cada uno; solo indica <strong>quién ya votó</strong>.</li>
            <li><strong>Cuando todos han votado</strong>, se revela el resultado: el jugador <strong>con más votos es expulsado</strong>.</li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">3) Resultado y vueltas siguientes</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>Si el expulsado <strong>era el impostor</strong>, <strong>termina la ronda</strong> y se reparten puntos.</li>
            <li>Si <strong>no era</strong> el impostor:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>El expulsado <strong>ya no participa</strong> en la ronda (ni pistas ni voto).</li>
                <li>Se <strong>desbloquea</strong> una <strong>nueva vuelta</strong>: los jugadores restantes vuelven a dar <strong>una pista</strong> y pueden <strong>votar cuando quieran</strong>.</li>
              </ul>
            </li>
            <li>El ciclo puede repetirse hasta una <strong>tercera vuelta</strong>.</li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4">4) Fin de la ronda</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li>La ronda termina cuando <strong>expulsan al impostor</strong>, <strong>o</strong> cuando, tras <strong>3 vueltas</strong>, <strong>no lo han descubierto</strong> → en ese caso, <strong>gana el impostor</strong> y obtiene la mayor cantidad de puntos.</li>
            <li>La app muestra:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Quién era el impostor.</li>
                <li>La palabra secreta.</li>
                <li>Puntos ganados por cada jugador.</li>
              </ul>
            </li>
            <li>El anfitrión puede <strong>iniciar una nueva ronda</strong>, salvo que alguien ya tenga <strong>15 puntos</strong>.</li>
          </ul>
        </section>

        {/* Sistema de puntos */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Sistema de puntos</h3>
          
          <h4 className="text-lg font-semibold text-blue-400 mb-2 mt-4">🔵 Amigos</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>+1</strong> punto por <strong>votar correctamente</strong> al impostor (aunque no sea expulsado) en cada vuelta.</li>
            <li><strong>+1</strong> punto adicional si el impostor es <strong>expulsado</strong>.</li>
          </ul>

          <h4 className="text-lg font-semibold text-red-400 mb-2 mt-4">🔴 Impostor</h4>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>+2</strong> puntos por <strong>sobrevivir cada vuelta</strong>.</li>
            <li><strong>+4</strong> puntos extra si <strong>gana la ronda</strong> (no lo descubren tras 3 vueltas).</li>
          </ul>

          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-neutral-400 italic">
              Los puntos se acumulan entre rondas.
            </p>
          </div>
        </section>

        {/* Reglas adicionales */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Reglas adicionales</h3>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>Empate</strong> en la votación: si hay empate se juega otra vuelta.</li>
            <li><strong>Desconexiones</strong>: quien se desconecte puede <strong>reingresar</strong> pero no podrá votar hasta que termine la ronda. Los puntos que había ganado no los pierde.</li>
          </ul>
        </section>

        {/* Consejos */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-neutral-50 mb-3">Consejos</h3>
          <ul className="list-disc list-inside space-y-2 text-neutral-300">
            <li><strong>Amigos</strong>: buscar pistas para que las entiendan <strong>los amigos</strong>, pero que <strong>no regalen</strong> la palabra.</li>
            <li><strong>Impostor</strong>: escuchad antes de hablar; <strong>coherencia y brillantez</strong>.</li>
            <li>La <strong>votación</strong> es tan importante como la pista: una sospecha bien argumentada <strong>mueve</strong> a todo el grupo.</li>
          </ul>
        </section>

      </div>
    </Modal>
  );
}

