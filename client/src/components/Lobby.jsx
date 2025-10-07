import React, { useState } from 'react';
import { Button } from './ui/Button';
import homeImg from '../assets/impostor-home.png';

export function Lobby({ onCreateGame, onJoinGame }) {
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const [showImpostorHint, setShowImpostorHint] = useState(true);

  const handleJoin = () => {
    if (!gameId.trim()) {
      setError('Por favor, introduce un código de juego.');
      return;
    }
    setError('');
    onJoinGame(gameId.trim().toUpperCase());
  };

  const handleCreateGame = () => {
    onCreateGame({ showImpostorHint });
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-4">
        <img src={homeImg} alt="Impostor" className="mx-auto w-56 h-56 rounded-full object-cover shadow-lg ring-1 ring-white/10" loading="lazy" />
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50">Empezar a jugar</h2>
        <p className="text-lg text-neutral-400 mt-2">Crea un nuevo juego o únete a uno existente.</p>
      </div>
      <div className="max-w-sm mx-auto space-y-4">
        {/* Opciones de juego */}
        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-200">Opciones de juego</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex-1">
              <span className="text-sm text-neutral-300">Mostrar pista al impostor</span>
              <p className="text-xs text-neutral-500 mt-1">El impostor verá la categoría de la palabra</p>
            </div>
            <button
              type="button"
              onClick={() => setShowImpostorHint(!showImpostorHint)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-neutral-950 ${
                showImpostorHint ? 'bg-orange-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  showImpostorHint ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
        
        <Button onClick={handleCreateGame} variant="primary" size="md">Crear nuevo juego</Button>
        <div className="relative flex items-center justify-center text-neutral-400"><span className="absolute bg-neutral-950 px-2">o</span><div className="w-full h-px bg-neutral-700"></div></div>
        <div className="space-y-2">
          <input 
            type="text" 
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Introduce el código del juego"
            maxLength="5"
            className="w-full h-12 px-4 rounded-md bg-white/10 border border-transparent focus:border-neutral-500 focus:ring-neutral-500 focus:outline-none text-center uppercase tracking-widest text-sm"
          />
          <Button onClick={handleJoin} variant="outline" size="md">Unirse a un juego</Button>
          {error && <p className="text-red-400 text-center pt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
