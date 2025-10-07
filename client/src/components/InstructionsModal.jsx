import React from 'react';
import { Modal } from './ui/Modal';

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instrucciones">
      <div className="max-w-none select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
        
        {/* ¿Qué es El impostor? */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">¿Qué es <em>El impostor</em>?</h3>
          <p className="text-neutral-300 leading-relaxed text-base">
            <em>El impostor</em> es un juego social de deducción que combina una <strong>app web</strong> con dinámica <strong>presencial</strong>.
          </p>
          <p className="text-neutral-300 leading-relaxed text-base mt-3">
            En cada <strong>partida</strong>, un jugador es el <strong>Impostor</strong> y el resto son <strong>Amigos.</strong> Se reparten las cartas. Los Amigos ven una <strong>palabra secreta</strong>; el Impostor no la conoce, pero puede recibir <strong>una pista orientativa</strong> (según elija el anfitrión al crear el juego).
            Cada jugador solo ha visto su carta y debe desconfiar de todo lo que sucede a su alrededor.
          </p>
          <p className="text-neutral-300 leading-relaxed text-base mt-3">
            A partir de <strong>pistas dichas en voz alta</strong> y <strong>votaciones</strong> en la app, el grupo intentará descubrir al impostor antes de que se salga con la suya.
          </p>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Qué necesitas */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Qué necesitas</h3>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><strong>Un dispositivo</strong> con conexión por jugador.</li>
            <li><strong>Espacio para jugar</strong> juntos (mesa/sofá) o <strong>videollamada</strong>.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Componentes del juego */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Componentes del juego</h3>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><strong>App web</strong>: gestiona <strong>roles, cartas, votos y puntos</strong>.</li>
            <li><strong>Interacción presencial</strong>: <strong>turnos y pistas</strong> se realizan <strong>fuera de la app</strong>, hablando en voz alta.</li>
            <li><strong>Jugadores</strong>: Mínimo 4. Sin límite.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Objetivo del juego */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Objetivo del juego</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">Como jugador</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><span className="text-white"><strong>Amigo</strong></span>: descubrir quién es el impostor y ganar puntos por ello.</li>
            <li><span className="text-orange-400"><strong>Impostor</strong></span>: <strong>fingir</strong> que conoces la palabra secreta para <strong>no ser descubierto y ganar puntos por ello.</strong></li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">Para ganar el juego</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li>Acumula <strong>15 puntos</strong> a lo largo de varias partidas.</li>
            <li>El juego continúa hasta que <strong>alguien alcance</strong> ese total o hasta que se completen <strong>3 partidas</strong>.</li>
            <li>Si se completan las 3 partidas sin que nadie llegue a 15 puntos, <strong>gana quien tenga más puntos</strong>.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Preparación */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Preparación</h3>
          <ol className="list-decimal list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li>Abre la <strong>app web</strong> en tu dispositivo.</li>
            <li><strong>Inicia sesión</strong>.</li>
            <li>Un jugador crea el juego como <strong>anfitrión</strong>, elige si mostrar o no la <strong>pista al impostor</strong>, y comparte <strong>enlace o código con el resto de jugadores.</strong></li>
            <li>Con todos conectados, el anfitrión pulsa <strong>"Comenzar juego"</strong>.</li>
          </ol>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Desarrollo del juego */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Desarrollo del juego</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">Estructura general</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li>Un <strong>juego</strong> se compone de <strong>varias partidas</strong>.</li>
            <li>Cada <strong>partida</strong> puede tener <strong>hasta 3 rondas</strong>.</li>
            <li>En cada <strong>ronda</strong>, todos los jugadores realizan <strong>su turno oral</strong> para dar <strong>una pista</strong>.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Roles y cartas */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Roles y cartas</h3>
          <p className="text-neutral-300 leading-relaxed mb-3 text-base">
            Al empezar una partida, cada jugador recibe una carta en la app:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><span className="text-white"><strong>Amigos</strong></span>: ven la <strong>palabra secreta</strong> (ej.: "Lavadora").</li>
            <li><span className="text-orange-400"><strong>Impostor</strong></span>: <strong>no</strong> ve la palabra exacta. Si el anfitrión activó la opción, recibe <strong>una pista orientativa</strong> (ej.: "Electrodomésticos"); si no, debe descubrir la palabra sin ayuda.</li>
          </ul>
          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-neutral-400 italic">
              Tu carta es privada: no la muestres ni reveles tu rol.
            </p>
          </div>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Dinámica presencial */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Dinámica presencial</h3>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li>La app <strong>no</strong> gestiona turnos de habla en tiempo real.</li>
            <li>Los <strong>turnos orales</strong> se organizan <strong>en persona</strong>: cada jugador dice <strong>una pista breve</strong> en voz alta cuando el grupo lo indique.</li>
            <li>La app <strong>indica quién debe empezar</strong> cada partida: la primera la inicia el anfitrión, y las siguientes rotan en orden de llegada (sentido horario virtual).</li>
            <li>A partir del jugador inicial, los turnos continúan en <strong>sentido horario</strong> hasta que todos hayan dado su pista.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Una partida, paso a paso */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Una partida, paso a paso</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">1) Primera ronda de pistas</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base mb-3">
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

          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">2) Votación (abierta durante la partida)</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><strong>En cualquier momento</strong> de la partida, puedes <strong>votar en la app</strong> a quien creas impostor.</li>
            <li><strong>No</strong> puedes votarte a ti mismo ni votar a jugadores ya eliminados.</li>
            <li>La app <strong>no</strong> muestra por quién votó cada uno; solo indica <strong>quién ya votó</strong>.</li>
            <li><strong>Puedes cambiar tu voto</strong> pulsando de nuevo sobre el jugador que votaste, pero <strong>solo antes de que el último jugador vote</strong>.</li>
            <li><strong>Cuando todos han votado</strong>, se revela el resultado: el jugador <strong>con más votos es expulsado</strong>.</li>
            <li>Si hay <strong>empate</strong> o nadie es eliminado, se inicia automáticamente una nueva ronda de pistas.</li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">3) Resultado y rondas siguientes</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li>Si el expulsado <strong>era el impostor</strong>, <strong>termina la partida</strong> y se reparten puntos.</li>
            <li>Si <strong>no era</strong> el impostor:
              <ul className="list-disc list-outside ml-10 mt-2 space-y-1 text-base">
                <li>El expulsado <strong>ya no participa</strong> en esa partida (ni pistas ni voto).</li>
                <li>Se <strong>desbloquea</strong> una <strong>nueva ronda</strong>: los jugadores restantes vuelven a dar <strong>una pista</strong> y pueden <strong>votar cuando quieran</strong>.</li>
              </ul>
            </li>
            <li>El ciclo puede repetirse hasta una <strong>tercera ronda</strong>.</li>
            <li><strong>Importante:</strong> Los jugadores eliminados solo están fuera de <strong>esa partida</strong>. Cuando empieza una <strong>nueva partida</strong>, todos vuelven a jugar desde cero.</li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-3 mt-4">4) Fin de la partida</h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li>La partida termina cuando <strong>expulsan al impostor</strong>, <strong>o</strong> cuando, tras <strong>3 rondas</strong>, <strong>no lo han descubierto</strong> → en ese caso, <strong>gana el impostor</strong> y obtiene la mayor cantidad de puntos.</li>
            <li>La app muestra:
              <ul className="list-disc list-outside ml-10 mt-2 space-y-1 text-base">
                <li>Quién era el impostor.</li>
                <li>La palabra secreta.</li>
                <li>Puntos ganados por cada jugador.</li>
              </ul>
            </li>
            <li>El anfitrión puede <strong>iniciar una nueva partida</strong>, salvo que alguien ya tenga <strong>15 puntos</strong>.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Sistema de puntos */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Sistema de puntos</h3>
          
          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4"><span className="text-white">Amigos</span></h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><strong>+1</strong> punto por <strong>votar correctamente</strong> al impostor (aunque no sea expulsado) en cada ronda.</li>
            <li><strong>+1</strong> punto adicional si el impostor es <strong>expulsado</strong>.</li>
          </ul>

          <h4 className="text-lg font-semibold text-neutral-200 mb-2 mt-4"><span className="text-orange-400">Impostor</span></h4>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><strong>+2</strong> puntos por terminar la <strong>primera ronda</strong> sin ser descubierto (solo si alguien fue eliminado).</li>
            <li><strong>+3</strong> puntos por terminar la <strong>segunda ronda</strong> sin ser descubierto (solo si alguien fue eliminado).</li>
            <li><strong>+4</strong> puntos por terminar la <strong>tercera ronda</strong> sin ser descubierto.</li>
            <li>Si hay <strong>empate en la votación</strong>, no se otorgan puntos y se inicia una nueva ronda.</li>
          </ul>

          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-neutral-400 italic">
              Los puntos se acumulan entre partidas.
            </p>
          </div>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Reglas adicionales */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Reglas adicionales</h3>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><strong>Empate</strong> en la votación: si hay empate, nadie es eliminado y se juega automáticamente otra ronda de pistas.</li>
            <li><strong>Cambio de voto:</strong> Puedes desmarcar tu voto y votar a otro jugador, pero solo antes de que el último jugador vote. Una vez todos han votado, se procesan los resultados.</li>
            <li><strong>Jugadores eliminados:</strong> Solo permanecen eliminados durante esa partida. En la siguiente partida, todos vuelven a participar.</li>
            <li><strong>Desconexiones:</strong> Quien se desconecte puede <strong>reingresar</strong>, pero los puntos acumulados se mantienen. La partida continúa sin esperar.</li>
          </ul>
        </section>

        <div className="my-8 h-px bg-white/10" />

        {/* Consejos */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Consejos</h3>
          <ul className="list-disc list-outside ml-5 space-y-2 text-neutral-300 text-base">
            <li><span className="text-white"><strong>Amigos</strong></span>: buscar pistas para que las entiendan <strong>los amigos</strong>, pero que <strong>no regalen</strong> la palabra.</li>
            <li><span className="text-orange-400"><strong>Impostor</strong></span>: escuchad antes de hablar; <strong>coherencia y brillantez</strong>.</li>
            <li>La <strong>votación</strong> es tan importante como la pista: una sospecha bien argumentada <strong>mueve</strong> a todo el grupo.</li>
          </ul>
        </section>

      </div>
    </Modal>
  );
}

