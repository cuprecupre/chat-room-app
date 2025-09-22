import React, { useEffect, useRef } from 'react';
import { Button } from './ui/Button';

function PlayerList({ players, currentUserId }) {
  return (
    <div className="w-full rounded-lg">
      <h2 className="text-lg font-semibold mb-3 text-indigo-300">Jugadores Conectados: {players.length}</h2>
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
          <p className="text-gray-400">¡Invita a tus amigos para empezar!</p>
          <div className="w-full space-y-3">
            {isHost && (
              <div className="relative" title={state.players.length < 2 ? 'Se necesitan al menos 2 jugadores' : ''}>
                <Button 
                  onClick={onStartGame} 
                  disabled={state.players.length < 2}
                  variant="primary"
                >
                  Comenzar Partida
                </Button>
              </div>
            )}
            <Button onClick={onCopyLink} variant="outline">Copiar Enlace de Invitación</Button>
            <Button onClick={onLeaveGame} variant="outline">Abandonar Sala</Button>
          </div>
          <div className="w-full mt-6">
            <PlayerList players={state.players} currentUserId={user.uid} />
          </div>
        </div>
      )}

      {state.phase === 'playing' && (
        <>
        <div className="w-full max-w-sm mx-auto text-center bg-white/10 rounded-lg p-6 flex flex-col">
          <p className="text-lg text-indigo-300">Tu rol:</p>
          <p className="text-4xl font-bold my-2">{state.role}</p>
          {state.role === 'impostor' ? (
            <p className="text-lg text-gray-400 mt-4">Tu objetivo es adivinar la palabra secreta.</p>
          ) : (
            <>
              <p className="text-lg text-indigo-300 mt-4">La palabra es:</p>
              <p className="text-3xl font-bold">{state.secretWord}</p>
            </>
          )}
          {isHost && <Button onClick={onEndGame} variant="danger" className="mt-6">Terminar Partida</Button>}
        </div>
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} />
        </div>
        <div className="w-full mt-4 pt-4 border-t border-white/10">
          <Button onClick={onLeaveGame} variant="ghost">Abandonar Partida</Button>
        </div>
        </>
      )}

      {state.phase === 'over' && (
        <>
        <div className="w-full max-w-sm mx-auto text-center bg-white/10 rounded-lg p-6 space-y-4 flex flex-col">
          <div>
            <p className="text-lg text-indigo-300">El impostor era:</p>
            <p className="font-bold text-3xl text-red-400 my-2">{state.impostorName}</p>
            <p className="text-lg text-indigo-300 mt-4">La palabra era:</p> 
            <p className="font-bold text-2xl">{state.secretWord}</p>
          </div>
          {isHost && <Button onClick={onPlayAgain} variant="primary">Jugar Otra Ronda</Button>}
        </div>
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} />
        </div>
        <div className="w-full max-w-sm mx-auto mt-4 pt-4 border-t border-white/10">
          <Button onClick={onLeaveGame} variant="ghost">Volver al Lobby</Button>
        </div>
        </>
      )}
    </div>
  );
}
