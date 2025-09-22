import React, { useEffect, useRef } from 'react';
// removed icons from labels
import { Button } from './ui/Button';
import waitImg from '../assets/reloj.png';

function PlayerList({ players, currentUserId }) {
  return (
    <div className="w-full rounded-lg">
      <h2 className="text-sm font-regular mb-3 text-gray-600">Jugadores Conectados: {players.length}</h2>
      <ul className="space-y-2">
        {players.map(p => (
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

export function GameRoom({ state, isHost, user, onStartGame, onEndGame, onPlayAgain, onLeaveGame, onCopyLink }) {
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
          <img src={waitImg} alt="Esperando jugadores" className="mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg ring-1 ring-white/10" />
          <p className="text-gray-400">¡Invita a tus amigos para empezar!</p>
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
            <Button onClick={onCopyLink} variant="outline" size="md">Copiar enlace</Button>
            <Button onClick={onLeaveGame} variant="outline" size="md">Abandonar sala</Button>
          </div>
          <div className="w-full mt-6">
            <PlayerList players={state.players} currentUserId={user.uid} />
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
              <p className="font-semibold text-base inline-block mt-2 px-3 py-1.5 rounded-md bg-black/30 ring-1 ring-white/10 text-neutral-50">
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
        <div className="w-full mt-4 pt-4 border-t border-white/10">
          <Button onClick={onLeaveGame} variant="ghost" size="md">Abandonar Partida</Button>
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
            <p className="font-semibold text-base inline-block mt-2 px-3 py-1.5 rounded-md bg-black/30 ring-1 ring-white/10 text-neutral-50">{capitalize(state.secretWord)}</p>
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
        <div className="w-full max-w-sm mx-auto mt-4 pt-4 border-t border-white/10">
          <Button onClick={onLeaveGame} variant="ghost" size="md">Volver al Lobby</Button>
        </div>
        </>
      )}
    </div>
  );
}
