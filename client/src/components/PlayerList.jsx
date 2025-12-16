import React, { useMemo, memo } from 'react';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';

const EMPTY_OBJ = {};
const EMPTY_ARR = [];

const PlayerList = memo(function PlayerList({ players, currentUserId, gameState, onVote }) {
  const isPlaying = gameState?.phase === 'playing';
  const isRoundResult = gameState?.phase === 'round_result';
  const isGameOver = gameState?.phase === 'game_over';
  const showScores = isRoundResult || isGameOver;

  const canVote = isPlaying && gameState?.canVote;
  const hasVoted = gameState?.hasVoted;
  const votedPlayers = gameState?.votedPlayers || EMPTY_ARR;
  const eliminatedPlayers = gameState?.eliminatedInRound || EMPTY_ARR;
  const activePlayers = gameState?.activePlayers || EMPTY_ARR;
  const myVote = gameState?.myVote || null; // A quién voté yo
  const playerScores = gameState?.playerScores || EMPTY_OBJ;
  const lastRoundScores = gameState?.lastRoundScores || EMPTY_OBJ;
  const playerOrder = gameState?.playerOrder || EMPTY_ARR;
  const startingPlayerId = gameState?.startingPlayerId;

  // Permitir cambiar voto solo si no todos han votado aún
  const allVoted = votedPlayers.length === activePlayers.length;
  const canChangeVote = hasVoted && !allVoted;

  // Ordenar jugadores según el contexto
  const sortedPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        // Si mostramos puntos, ordenar por puntuación
        if (showScores) {
          return (playerScores[b.uid] || 0) - (playerScores[a.uid] || 0);
        }
        // Si hay playerOrder (orden base), usarlo
        if (playerOrder.length > 0) {
          const indexA = playerOrder.indexOf(a.uid);
          const indexB = playerOrder.indexOf(b.uid);
          // Si ambos están en el orden, ordenar por índice
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // Si solo uno está, el que está va primero
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
        }
        // Fallback: usuario actual siempre primero
        if (a.uid === currentUserId) return -1;
        if (b.uid === currentUserId) return 1;
        // Ordenar por nombre
        return a.name.localeCompare(b.name);
      });
  }, [players, showScores, playerScores, playerOrder, currentUserId]);

  const canVoteFor = (playerId) => {
    return canVote &&
      playerId !== currentUserId &&
      !eliminatedPlayers.includes(playerId) &&
      activePlayers.includes(playerId);
  };

  const isMyVote = (playerId) => {
    return myVote === playerId;
  };

  // Determinar qué título mostrar (solo en fases playing/result/game_over)
  const isLobby = !isPlaying && !showScores;
  let headerText = isPlaying ? 'Vota al jugador que creas impostor' : '';
  if (showScores) {
    headerText = isGameOver ? 'Resto de jugadores' : 'Puntuación parcial';
  }

  // Subtítulo descriptivo para la fase de playing
  const showOrderSubtitle = isPlaying && playerOrder.length > 0;

  return (
    <div className="w-full rounded-lg">
      {/* Solo mostrar header si no estamos en lobby */}
      {!isLobby && (
        <div className="mb-3 text-center">
          <p className={`${isPlaying || showScores ? 'text-base font-regular text-neutral-200' : 'text-sm font-regular text-neutral-500'}`}>
            {headerText}
          </p>
        </div>
      )}
      <ul className="space-y-2">
        {sortedPlayers.map((p) => {
          const isEliminated = eliminatedPlayers.includes(p.uid);
          const hasVoted = votedPlayers.includes(p.uid);
          const showVoteButton = canVoteFor(p.uid);
          const iVotedForThisPlayer = isMyVote(p.uid);
          const score = playerScores[p.uid] || 0;
          const scoreGained = lastRoundScores[p.uid] || 0;
          // No marcar ganadores en la lista si es game_over (ya están arriba en bloque dedicado)
          const isWinner = false;

          return (
            <li key={p.uid} className={`flex items-center justify-between bg-white/5 p-4 rounded-md ${isWinner ? 'bg-orange-500/10' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar photoURL={p.photoURL} displayName={p.name} size="sm" />
                  {/* Check verde solo si este usuario ya votó (todos lo ven) */}
                  {isPlaying && hasVoted && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-950 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!isPlaying && !showScores && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-950"></div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isWinner ? 'text-orange-400' : ''}`}>
                      {p.name}{p.uid === currentUserId ? ' (Tú)' : ''}
                    </span>
                    {/* Indicador de jugador inicial */}
                    {isPlaying && startingPlayerId === p.uid && (
                      <span className="text-orange-400 text-sm" title="Empieza esta ronda">
                        ☀️
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mostrar puntos o botón de votar según fase */}
              <div className="flex items-center gap-3">
                {isEliminated && isPlaying && (
                  <span className="text-xs text-red-400 font-medium">Eliminado</span>
                )}
                {showScores ? (
                  <div className="text-right">
                    {isRoundResult ? (
                      // Mostrar puntos ganados y total en resultado de ronda (para todos)
                      <div className="flex flex-col items-end gap-0.5">
                        <div className={`text-xs font-medium ${scoreGained > 0 ? 'text-green-400' : 'text-neutral-500'}`}>
                          {scoreGained > 0 ? '+' : ''}{scoreGained} pts
                        </div>
                        <div className={`text-sm ${isWinner ? 'text-orange-400' : 'text-neutral-400'}`}>
                          Total: {score}
                        </div>
                      </div>
                    ) : (
                      // Solo mostrar total en game over
                      <span className={`font-medium ${isWinner ? 'text-orange-400' : 'text-neutral-300'}`}>
                        {score} pts
                      </span>
                    )}
                  </div>
                ) : isPlaying && canVote && (
                  // Mostrar botón solo si:
                  // 1. No he votado aún (mostrar todos los botones)
                  // 2. Ya voté por este jugador (mostrar solo este botón)
                  (myVote === null || iVotedForThisPlayer) && showVoteButton && (
                    <Button
                      onClick={() => {
                        // Si ya voté por este jugador y puedo cambiar voto, quitar el voto
                        if (iVotedForThisPlayer && canChangeVote) {
                          onVote(null);
                        } else {
                          // Votar por este jugador
                          onVote(p.uid);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={iVotedForThisPlayer && !canChangeVote}
                      className={`!w-auto gap-2 px-4 ${iVotedForThisPlayer
                        ? canChangeVote
                          ? '!border-green-500 !text-green-400 !bg-green-500/10 hover:!bg-green-500/20'
                          : '!border-green-500 !text-green-400 !bg-green-500/10 !hover:bg-green-500/10 cursor-not-allowed'
                        : ''
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                      </svg>
                      <span>{iVotedForThisPlayer ? 'Votado' : 'Votar'}</span>
                    </Button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {/* Subtítulo al final de la lista */}
      {showOrderSubtitle && (
        <p className="text-xs text-neutral-400 mt-3 text-center">
          ☀️ Jugador que empieza la partida
        </p>
      )}
      {/* Divider para separar del footer */}
      {isPlaying && (
        <div className="w-full h-px bg-neutral-800 mt-10"></div>
      )}
    </div>
  );
});

export { PlayerList };
