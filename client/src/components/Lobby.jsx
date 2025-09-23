import React, { useState } from 'react';
import { Button } from './ui/Button';
import maskImg from '../assets/llave.png';

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
      <div className="text-center space-y-4">
        <img src={maskImg} alt="Llave" className="mx-auto w-64 h-64 sm:w-64 sm:h-64 rounded-full object-cover shadow-lg ring-1 ring-white/10" />
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50">Empieza a jugar</h2>
        <p className="text-lg text-gray-400 mt-2">Crea una nueva partida o únete a una existente.</p>
      </div>
      <div className="max-w-sm mx-auto space-y-4">
        <Button onClick={onCreateGame} variant="primary" size="md">Crear Nueva Partida</Button>
        <div className="relative flex items-center justify-center text-gray-400"><span className="absolute bg-neutral-950 px-2">o</span><div className="w-full h-px bg-neutral-700"></div></div>
        <div className="space-y-2">
          <input 
            type="text" 
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Introduce el código de la partida"
            maxLength="5"
            className="w-full h-12 px-4 rounded-md bg-white/10 border border-transparent focus:border-neutral-500 focus:ring-neutral-500 focus:outline-none text-center uppercase tracking-widest text-sm"
          />
          <Button onClick={handleJoin} variant="outline" size="md">Unirse a Partida</Button>
          {error && <p className="text-red-400 text-center pt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
