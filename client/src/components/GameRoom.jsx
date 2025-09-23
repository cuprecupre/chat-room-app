import React, { useEffect, useRef } from 'react';
// removed icons from labels
import { Button } from './ui/Button';
import waitImg from '../assets/reloj.png';

function PlayerList({ players, currentUserId }) {
  // Ordenar jugadores para que el usuario actual aparezca primero
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.uid === currentUserId) return -1;
    if (b.uid === currentUserId) return 1;
    return 0;
  });

  return (
    <div className="w-full rounded-lg">
      <p className="text-sm font-regular mb-3 text-neutral-600">Jugadores Conectados: {players.length}</p>
      <ul className="space-y-2">
        {sortedPlayers.map(p => (
          <li key={p.uid} className="flex items-center justify-between bg-white/5 p-4 rounded-md">
            <div className="flex items-center gap-3">
              <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full" />
              <span className="font-medium">{p.name}{p.uid === currentUserId ? ' (Tú)' : ''}</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GameRoom({ state, isHost, user, onStartGame, onEndGame, onPlayAgain, onLeaveGame, onCopyLink, onCopyGameCode }) {
  const capitalize = (s) => (typeof s === 'string' && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const prevPlayersRef = useRef(state.players);

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

  return (
    <div className="w-full flex flex-col items-center space-y-6">

      {state.phase === 'lobby' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <img src={waitImg} alt="Esperando jugadores" className="mx-auto w-48 h-48 sm:w-48 sm:h-48 rounded-full object-cover shadow-lg ring-1 ring-white/10" loading="lazy" />
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50">Invita a tus amigos para empezar</h2>
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
            <Button onClick={onCopyLink} variant={state.players.length === 1 ? "primary" : "outline"} size="md">Copiar enlace</Button>
          </div>
          <div className="w-full mt-6">
            <PlayerList players={state.players} currentUserId={user.uid} />
          </div>
          
          {/* Footer con código de sala */}
          <div className="w-full max-w-sm mx-auto mt-6 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <button
                onClick={() => onCopyGameCode()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 rounded-md transition-colors"
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
        <div className="w-full max-w-sm mx-auto text-center rounded-xl p-6 flex flex-col bg-gradient-to-b from-white/10 to-white/5 ring-1 ring-white/10 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-400">
            <span>Tu rol</span>
          </div>
          <p className="text-xl font-semibold mt-2 text-neutral-50">{capitalize(state.role)}</p>
          {state.role === 'impostor' ? (
            <p className="text-sm text-gray-300 mt-3">Tu objetivo es adivinar la palabra secreta.</p>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-300 mt-4">
                <span>Palabra secreta</span>
              </div>
              <p className="font-semibold text-xl mt-2 text-neutral-50">
                {capitalize(state.secretWord)}
              </p>
            </>
          )}
          {/* Botón Terminar Partida fuera del recuadro */}
        </div>
        {isHost && (
          <div className="w-full max-w-sm mx-auto">
            <Button onClick={onEndGame} variant="danger" size="md">Terminar Partida</Button>
          </div>
        )}
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} />
        </div>
        {/* Footer único y consistente */}
        <div className="w-full max-w-sm mx-auto mt-6 pt-4 border-t border-white/5">
          <div className="space-y-4">
            <button
              onClick={() => onCopyGameCode()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 rounded-md transition-colors"
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
        <div className="w-full max-w-sm mx-auto text-center rounded-xl p-6 space-y-4 flex flex-col bg-gradient-to-b from-white/10 to-white/5 ring-1 ring-white/10 shadow-xl">
          <div>
            <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-300">
              <span>Impostor</span>
            </div>
            <p className="font-semibold text-lg text-red-400 mt-2">{state.impostorName}</p>
            <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-300 mt-4">
              <span>Palabra secreta</span>
            </div>
            <p className="font-semibold text-xl mt-2 text-neutral-50">{capitalize(state.secretWord)}</p>
          </div>
          {/* Botón Jugar Otra Ronda fuera del recuadro */}
        </div>
        {isHost && (
          <div className="w-full max-w-sm mx-auto">
            <Button onClick={onPlayAgain} variant="primary" size="md">Jugar Otra Ronda</Button>
          </div>
        )}
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} />
        </div>
        {/* Footer único y consistente */}
        <div className="w-full max-w-sm mx-auto mt-6 pt-4 border-t border-white/5">
          <div className="space-y-4">
            <button
              onClick={() => onCopyGameCode()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 rounded-md transition-colors"
              title="Copiar código"
            >
              <span>Código de sala: <span className="font-mono font-semibold text-neutral-300">{state.gameId}</span></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <Button onClick={onLeaveGame} variant="outline" size="md">Abandonar partida</Button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
