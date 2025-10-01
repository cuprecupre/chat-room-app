import React, { useEffect, useRef, useState } from 'react';
// removed icons from labels
import { Button } from './ui/Button';
import keyImg from '../assets/llave.png';
import dualImpostorImg from '../assets/dual-impostor.png';
import cardImg from '../assets/card.png';
import cardBackImg from '../assets/card-back.png';

function PlayerList({ players, currentUserId, isHost, onCopyLink }) {
  // Ordenar jugadores para que el usuario actual aparezca primero
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.uid === currentUserId) return -1;
    if (b.uid === currentUserId) return 1;
    return 0;
  });

  const handleImageError = (e) => {
    console.log('❌ Error cargando imagen:', e.target.src);
    // Si la imagen falla, mostrar iniciales del nombre
    const name = e.target.alt || 'U';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    e.target.style.display = 'none';
    e.target.nextSibling.textContent = initials;
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <div className="w-full rounded-lg">
      <p className="text-sm font-regular mb-3 text-neutral-500">Jugadores Conectados: {players.length}</p>
      <ul className="space-y-2">
        {sortedPlayers.map(p => {
          console.log('👤 Jugador:', { name: p.name, photoURL: p.photoURL, uid: p.uid });
          return (
            <li key={p.uid} className="flex items-center bg-white/5 p-4 rounded-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={p.photoURL} 
                    alt={p.name} 
                    className="w-8 h-8 rounded-full object-cover" 
                    onError={handleImageError}
                    onLoad={(e) => {
                      console.log('✅ Imagen cargada:', e.target.src);
                      // Ocultar placeholder cuando la imagen se carga
                      e.target.nextSibling.style.display = 'none';
                    }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {/* Bullet de estado posicionado como en LinkedIn/Facebook */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-950"></div>
                </div>
                <span className="font-medium">{p.name}{p.uid === currentUserId ? ' (Tú)' : ''}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GameRoom({ state, isHost, user, onStartGame, onEndGame, onPlayAgain, onLeaveGame, onCopyLink, onCopyGameCode }) {
  const capitalize = (s) => (typeof s === 'string' && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const prevPlayersRef = useRef(state.players);
  const [reveal, setReveal] = useState(false);
  const revealTimeoutRef = useRef(null);

  useEffect(() => {
    const previousPlayers = prevPlayersRef.current;
    const currentPlayers = state.players;

    if (previousPlayers.length > currentPlayers.length) {
      const leftPlayer = previousPlayers.find(p => 
        !currentPlayers.some(cp => cp.uid === p.uid)
      );
      if (leftPlayer) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: `${leftPlayer.name} ha abandonado la partida.` }));
      }
    }

    prevPlayersRef.current = currentPlayers;
  }, [state.players]);

  // Reveal helpers
  const triggerReveal = () => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    setReveal(!reveal); // Toggle entre mostrar/ocultar
  };


  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center space-y-6">

      {state.phase === 'lobby' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <img src={dualImpostorImg} alt="Esperando jugadores" className="mx-auto w-48 h-48 sm:w-48 sm:h-48 rounded-full object-cover shadow-lg ring-1 ring-white/10" loading="lazy" />
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50">Invita a tus amigos<br />para empezar</h2>
          <p className="text-lg text-neutral-400 mt-2">Se necesitan al menos 4 jugadores.</p>
          <div className="w-full space-y-3">
            {isHost && (
              <div className="relative" title={state.players.length < 2 ? 'Se necesitan al menos 2 jugadores' : ''}>
                <Button 
                  onClick={onStartGame} 
                  disabled={state.players.length < 2}
                  variant="primary"
                  size="md"
                >
                  Comenzar partida
                </Button>
              </div>
            )}
          </div>
          <div className="w-full mt-6">
            <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} />
          </div>
          {!isHost && (
            <div className="w-full mt-4">
              <Button onClick={onCopyLink} variant={state.players.length === 1 ? "primary" : "outline"} size="md">Copiar enlace</Button>
            </div>
          )}
          
          {/* Footer con código de sala */}
          <div className="w-full max-w-sm mx-auto mt-6 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <button
                onClick={() => onCopyGameCode()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150"
                title="Copiar código"
              >
                <span>Código de sala: <span className="font-mono font-semibold text-neutral-300">{state.gameId}</span></span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <Button onClick={onLeaveGame} variant="ghost" size="md" className="gap-2">
                <span>Abandonar partida</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'playing' && (
        <>
        <div className="w-full max-w-sm mx-auto text-center mb-5">
          <h2 className="text-2xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>Tu carta</h2>
        </div>
        <div className="w-full max-w-sm mx-auto space-y-3">
          <div className="flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full">
            <div className={`flip-card-inner h-full ${reveal ? 'is-flipped' : ''}`}>
              {/* Frente completo (card completa con imagen) */}
              <div className="flip-card-front">
                <div className="h-full flex items-center justify-center">
                  <img 
                    src={cardImg} 
                    alt="Frente de la carta" 
                    className="w-full h-full object-cover rounded-xl cursor-pointer" 
                    onClick={triggerReveal}
                    title="Ver mi carta"
                  />
                </div>
              </div>
              {/* Dorso completo (card completa con información) */}
              <div className="flip-card-back">
                <div className="relative h-full flex flex-col items-center justify-center rounded-xl overflow-hidden">
                  {/* Imagen de fondo */}
                  <img 
                    src={cardBackImg} 
                    alt="Fondo del dorso" 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                  {/* Contenido sobre la imagen */}
                  <div 
                    className="relative z-10 text-center p-8 backdrop-blur-sm rounded-xl cursor-pointer" 
                    onClick={triggerReveal}
                    title="Volver al frente"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-300">
                          <span>Tu rol</span>
                        </div>
                        <p className="text-xl font-semibold mt-1 text-white" style={{fontFamily: 'Trocchi, serif'}}>{capitalize(state.role)}</p>
                      </div>
                      {state.role === 'impostor' ? (
                        <>
                          {state.secretCategory && (
                            <p className="text-sm text-gray-200">
                              La pista para descubrir la palabra secreta es:<br />
                              <span className="text-white font-semibold uppercase" style={{fontFamily: 'Trocchi, serif'}}>{state.secretCategory}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <div>
                          <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-200">
                            <span>Palabra secreta</span>
                          </div>
                          <p className="font-semibold text-xl mt-1 text-white" style={{fontFamily: 'Trocchi, serif'}}>
                            {capitalize(state.secretWord)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Botón Girar carta */}
          <div className="flex justify-center">
            <button
              onClick={triggerReveal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150 border border-neutral-600/30 hover:border-neutral-500/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Girar carta</span>
            </button>
          </div>
        </div>
        {isHost && (
          <div className="w-full max-w-sm mx-auto">
            <Button onClick={onEndGame} variant="outline" size="md" className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20">Terminar Partida</Button>
          </div>
        )}
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} />
        </div>
        {/* Footer único y consistente */}
        <div className="w-full max-w-sm mx-auto mt-6 pt-4 border-t border-white/5">
          <div className="space-y-4">
            <button
              onClick={() => onCopyGameCode()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150"
              title="Copiar código"
            >
              <span>Código de sala: <span className="font-mono font-semibold text-neutral-300">{state.gameId}</span></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <Button onClick={onLeaveGame} variant="ghost" size="md" className="gap-2">
              <span>Abandonar partida</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
        </>
      )}

      {state.phase === 'over' && (
        <>
        <div className="w-full max-w-sm mx-auto text-center mb-5">
          <h2 className="text-2xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>Resultado</h2>
        </div>
        <div className="w-full max-w-sm mx-auto space-y-3">
          <div className="flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full">
            <div className="flip-card-inner h-full is-flipped">
              {/* Frente completo (card completa con imagen) */}
              <div className="flip-card-front">
                <div className="h-full flex items-center justify-center">
                  <img 
                    src={cardImg} 
                    alt="Frente de la carta" 
                    className="w-full h-full object-cover rounded-xl" 
                  />
                </div>
              </div>
              {/* Dorso completo (card completa con información) */}
              <div className="flip-card-back">
                <div className="relative h-full flex flex-col items-center justify-center rounded-xl overflow-hidden">
                  {/* Imagen de fondo */}
                  <img 
                    src={cardBackImg} 
                    alt="Fondo del dorso" 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                  {/* Contenido sobre la imagen */}
                  <div 
                    className="relative z-10 text-center p-8 backdrop-blur-sm rounded-xl cursor-pointer" 
                    onClick={triggerReveal}
                    title="Volver al frente"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-300">
                          <span>Impostor</span>
                        </div>
                        <p className="font-semibold text-lg text-orange-400 mt-1" style={{fontFamily: 'Trocchi, serif'}}>{state.impostorName}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-300">
                          <span>Palabra secreta</span>
                        </div>
                        <p className="font-semibold text-xl mt-1 text-orange-400" style={{fontFamily: 'Trocchi, serif'}}>{capitalize(state.secretWord)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isHost && (
          <div className="w-full max-w-sm mx-auto">
            <Button onClick={onPlayAgain} variant="primary" size="md">Jugar Otra Ronda</Button>
          </div>
        )}
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} />
        </div>
        {/* Footer único y consistente */}
        <div className="w-full max-w-sm mx-auto mt-6 pt-4 border-t border-white/5">
          <div className="space-y-4">
            <button
              onClick={() => onCopyGameCode()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150"
              title="Copiar código"
            >
              <span>Código de sala: <span className="font-mono font-semibold text-neutral-300">{state.gameId}</span></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <Button onClick={onLeaveGame} variant="ghost" size="md" className="gap-2">
              <span>Abandonar partida</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
