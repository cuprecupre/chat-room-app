import React, { useEffect, useRef } from 'react';

function PlayerList({ players, currentUserId }) {
  return (
    <div className="w-full bg-white/10 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-violet-300">Jugadores Conectados: {players.length}</h2>
      <ul className="space-y-2">
        {players.map(p => (
          <li key={p.uid} className="flex items-center justify-between bg-white/5 p-2 rounded-md">
            <div className="flex items-center gap-3">
              <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full" />
              <span className="font-medium">{p.name}{p.uid === currentUserId ? ' (Tú)' : ''}</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
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
      <PlayerList players={state.players} currentUserId={user.uid} />

      {state.phase === 'lobby' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <p className="text-gray-400">¡Invita a tus amigos para empezar!</p>
          <div className="w-full space-y-3">
            {isHost && (
              <div className="relative" title={state.players.length < 2 ? 'Se necesitan al menos 2 jugadores' : ''}>
                <button 
                  onClick={onStartGame} 
                  disabled={state.players.length < 2}
                  className="w-full h-11 inline-flex items-center justify-center rounded-md bg-violet-600 text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-violet-700">
                  Comenzar Partida
                </button>
              </div>
            )}
            <button onClick={onCopyLink} className="w-full h-11 inline-flex items-center justify-center rounded-md bg-gray-600 text-white hover:bg-gray-700 font-semibold">Copiar Enlace de Invitación</button>
            <button onClick={onLeaveGame} className="w-full text-gray-500 hover:text-gray-400 pt-2">Abandonar Sala</button>
          </div>
        </div>
      )}

      {state.phase === 'playing' && (
        <div className="w-full max-w-sm mx-auto text-center bg-white/10 rounded-lg p-6">
          <p className="text-lg text-violet-300">Tu rol:</p>
          <p className="text-4xl font-bold my-2">{state.role}</p>
          {state.role === 'impostor' ? (
            <p className="text-lg text-gray-400 mt-4">Tu objetivo es adivinar la palabra secreta.</p>
          ) : (
            <>
              <p className="text-lg text-violet-300 mt-4">La palabra es:</p>
              <p className="text-3xl font-bold">{state.secretWord}</p>
            </>
          )}
          {isHost && <button onClick={onEndGame} className="w-full mt-6 h-11 inline-flex items-center justify-center rounded-md bg-red-500 text-white hover:bg-red-600 font-semibold">Terminar Partida</button>}
          <button onClick={onLeaveGame} className="w-full text-gray-500 hover:text-gray-400 pt-4 mt-2">Abandonar Partida</button>
        </div>
      )}

      {state.phase === 'over' && (
        <div className="w-full max-w-sm mx-auto text-center bg-white/10 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-lg text-violet-300">El impostor era:</p>
            <p className="font-bold text-3xl text-red-400 my-2">{state.impostorName}</p>
            <p className="text-lg text-violet-300 mt-4">La palabra era:</p> 
            <p className="font-bold text-2xl">{state.secretWord}</p>
          </div>
          {isHost && <button onClick={onPlayAgain} className="w-full h-11 inline-flex items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-700 font-semibold">Jugar Otra Ronda</button>}
          <button onClick={onLeaveGame} className="w-full text-gray-500 hover:text-gray-400 pt-2">Volver al Lobby</button>
        </div>
      )}
    </div>
  );
}
