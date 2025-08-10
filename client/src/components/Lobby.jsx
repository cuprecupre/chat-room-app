import React, { useState } from 'react';

export function Lobby({ onCreateGame, onJoinGame }) {
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!gameId.trim()) {
      setError('Por favor, introduce un código de partida.');
      return;
    }
    setError('');
    onJoinGame(gameId.trim().toUpperCase());
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-violet-400">Lobby Principal</h2>
        <p className="text-lg text-gray-400 mt-2">Crea una nueva partida o únete a una existente.</p>
      </div>
      <div className="max-w-sm mx-auto space-y-4">
        <button onClick={onCreateGame} className="w-full h-12 inline-flex items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-700 font-semibold text-lg">Crear Nueva Partida</button>
        <div className="relative flex items-center justify-center text-gray-400"><span className="absolute bg-gray-900 px-2">o</span><div className="w-full h-px bg-gray-700"></div></div>
        <div className="space-y-2">
          <input 
            type="text" 
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Introduce el código de la partida"
            maxLength="5"
            className="w-full h-12 px-4 rounded-md bg-white/10 border border-transparent focus:border-violet-500 focus:ring-violet-500 focus:outline-none text-center uppercase tracking-widest"
          />
          <button onClick={handleJoin} className="w-full h-12 inline-flex items-center justify-center rounded-md bg-gray-600 text-white hover:bg-gray-700 font-semibold">Unirse a Partida</button>
          {error && <p className="text-red-400 text-center pt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
