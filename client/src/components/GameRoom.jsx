import React, { useEffect, useRef, useState } from 'react';
// removed icons from labels
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import keyImg from '../assets/llave.png';
import dualImpostorImg from '../assets/dual-impostor.png';
import cardImg from '../assets/card.png';
import cardBackImg from '../assets/card-back.png';

function PlayerList({ players, currentUserId, isHost, onCopyLink, gameState, onVote }) {
  const isPlaying = gameState?.phase === 'playing';
  const isRoundResult = gameState?.phase === 'round_result';
  const isGameOver = gameState?.phase === 'game_over';
  const showScores = isRoundResult || isGameOver;
  
  const canVote = isPlaying && gameState?.canVote;
  const hasVoted = gameState?.hasVoted;
  const votedPlayers = gameState?.votedPlayers || [];
  const eliminatedPlayers = gameState?.eliminatedInRound || [];
  const activePlayers = gameState?.activePlayers || [];
  const myVote = gameState?.myVote || null; // A quién voté yo
  const playerScores = gameState?.playerScores || {};
  const lastRoundScores = gameState?.lastRoundScores || {};
  const playerOrder = gameState?.playerOrder || [];
  const startingPlayerId = gameState?.startingPlayerId;
  
  // Permitir cambiar voto solo si no todos han votado aún
  const allVoted = votedPlayers.length === activePlayers.length;
  const canChangeVote = hasVoted && !allVoted;
  
  // Detectar ganadores en caso de empate
  const isTie = gameState?.winner === 'Empate';
  const winners = isTie ? (() => {
    const maxScore = Math.max(...Object.values(playerScores));
    return players.filter(player => (playerScores[player.uid] || 0) === maxScore);
  })() : [];
  
  // Si hay 3 o más ganadores, no hay ganadores reales
  const hasNoWinners = winners.length >= 3;
  
  // Ordenar jugadores según el contexto
  const sortedPlayers = [...players]
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

  const handleImageError = (e) => {
    console.log('❌ Error cargando imagen:', e.target.src);
    // Si la imagen falla, mostrar iniciales del nombre
    const name = e.target.alt || 'U';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    e.target.style.display = 'none';
    e.target.nextSibling.textContent = initials;
    e.target.nextSibling.style.display = 'flex';
  };

  const canVoteFor = (playerId) => {
    return canVote && 
           playerId !== currentUserId && 
           !eliminatedPlayers.includes(playerId) &&
           activePlayers.includes(playerId);
  };
  
  const isMyVote = (playerId) => {
    return myVote === playerId;
  };

  // Determinar qué título mostrar
  let headerText = isPlaying ? 'Orden de jugadores' : `Jugadores Conectados: ${players.length}`;
  if (showScores) { 
    headerText = isGameOver ? 'Resto de jugadores' : 'Puntuación';
  }
  
  // Subtítulo descriptivo para la fase de playing
  const showOrderSubtitle = isPlaying && playerOrder.length > 0;

  return (
    <div className="w-full rounded-lg">
      <div className="mb-3 text-center">
        <p className={`${isPlaying || showScores ? 'text-base font-regular text-neutral-200' : 'text-sm font-regular text-neutral-500'}`}>
          {headerText}
        </p>
        {showOrderSubtitle && (
          <p className="text-xs text-neutral-400 mt-1">
            🎯 Jugador que empieza la partida
          </p>
        )}
      </div>
      <ul className="space-y-2">
        {sortedPlayers.map((p, index) => {
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
                        🎯
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
                    {isRoundResult && scoreGained > 0 ? (
                      // Mostrar puntos ganados y total en resultado de ronda
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="text-xs text-green-400 font-medium">
                          +{scoreGained} pts
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
                      className={`!w-auto gap-2 px-4 ${
                        iVotedForThisPlayer 
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
    </div>
  );
}

export function GameRoom({ state, isHost, user, onStartGame, onEndGame, onPlayAgain, onLeaveGame, onCopyLink, onCopyGameCode, onVote, isMobile }) {
  const capitalize = (s) => (typeof s === 'string' && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const prevPlayersRef = useRef(state.players);
  const prevTurnRef = useRef(state.currentTurn);
  const prevPhaseRef = useRef(state.phase);
  const [reveal, setReveal] = useState(false);
  const [showTurnOverlay, setShowTurnOverlay] = useState(false);
  const [isOverlayClosing, setIsOverlayClosing] = useState(false);
  const [eliminatedPlayerInfo, setEliminatedPlayerInfo] = useState(null);
  const [showCardEntrance, setShowCardEntrance] = useState(false);
  const [showRestOfUI, setShowRestOfUI] = useState(true);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
  const revealTimeoutRef = useRef(null);
  const turnOverlayTimeoutRef = useRef(null);
  const restUITimeoutRef = useRef(null);

  useEffect(() => {
    const previousPlayers = prevPlayersRef.current;
    const currentPlayers = state.players;

    if (previousPlayers.length > currentPlayers.length) {
      const leftPlayer = previousPlayers.find(p => 
        !currentPlayers.some(cp => cp.uid === p.uid)
      );
      if (leftPlayer) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: `${leftPlayer.name} ha abandonado el juego.` }));
      }
    }

    prevPlayersRef.current = currentPlayers;
  }, [state.players]);

  // Reveal helpers
  const triggerReveal = () => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    
    const newRevealState = !reveal;
    setReveal(newRevealState);
    
    // Si voltea la carta (muestra el dorso), iniciar temporizador para volver al frente después de 5 segundos
    if (newRevealState) {
      revealTimeoutRef.current = setTimeout(() => {
        setReveal(false);
      }, 5000);
    }
  };


  // Detectar cambio de ronda y mostrar overlay
  useEffect(() => {
    const prevTurn = prevTurnRef.current;
    const currentTurn = state.currentTurn;
    
    // Si la ronda cambió y es ronda 2 o superior (nueva ronda), mostrar overlay y resetear carta
    if (state.phase === 'playing' && prevTurn && currentTurn > prevTurn && currentTurn > 1) {
      // Resetear carta al estado frontal
      setReveal(false);
      
      // Buscar al jugador eliminado en la vuelta anterior
      const lastEliminatedId = state.lastEliminatedInTurn;
      if (lastEliminatedId) {
        const eliminatedPlayer = state.players.find(p => p.uid === lastEliminatedId);
        setEliminatedPlayerInfo(eliminatedPlayer || null);
      } else {
        // No hubo eliminación (empate)
        setEliminatedPlayerInfo(null);
      }
      
      setShowTurnOverlay(true);
      setIsOverlayClosing(false);
      
      // Iniciar animación de salida después de 2.7 segundos
      if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
      turnOverlayTimeoutRef.current = setTimeout(() => {
        setIsOverlayClosing(true);
        
        // Ocultar completamente después de la animación (300ms)
        setTimeout(() => {
          setShowTurnOverlay(false);
          setIsOverlayClosing(false);
          setEliminatedPlayerInfo(null);
        }, 300);
      }, 2700);
    }
    
    prevTurnRef.current = currentTurn;
  }, [state.currentTurn, state.phase, state.lastEliminatedInTurn, state.players]);
  
  // Resetear carta cuando empieza una nueva partida (playing)
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const currentPhase = state.phase;
    
    // Si pasamos a playing desde otra fase, resetear carta
    if (currentPhase === 'playing' && prevPhase !== 'playing') {
      setReveal(false);
      
      // Mostrar animación de entrada si viene del lobby, game_over o round_result
      const shouldShowAnimation = prevPhase === 'lobby' || prevPhase === 'game_over' || prevPhase === 'round_result';
      
      if (shouldShowAnimation) {
        // Ocultar el resto de la UI hasta que termine la animación de la carta
        setShowRestOfUI(false);
        setShowCardEntrance(true);
        
        // Después de 800ms (duración de animate-cardEntrance), mostrar el resto de elementos
        if (restUITimeoutRef.current) clearTimeout(restUITimeoutRef.current);
        restUITimeoutRef.current = setTimeout(() => {
          setShowRestOfUI(true);
        }, 800);
        
        // Quitar la animación después de que termine
        setTimeout(() => {
          setShowCardEntrance(false);
        }, 800);
      } else {
        // Si no hay animación, mostrar todo inmediatamente
        setShowRestOfUI(true);
      }
    }
    
    prevPhaseRef.current = currentPhase;
  }, [state.phase]);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
      if (restUITimeoutRef.current) clearTimeout(restUITimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center space-y-6">

      {state.phase === 'lobby' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <img src={dualImpostorImg} alt="Esperando jugadores" className="mx-auto w-56 h-56 rounded-full object-cover shadow-lg ring-1 ring-white/10" loading="lazy" />
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50">Invita a tus amigos<br />para empezar</h2>
          <p className="text-lg text-neutral-400 mt-2">Esperando a que se unan los jugadores.</p>
          <div className="w-full space-y-3">
            {isHost && (
              <>
                <div className="relative" title={state.players.length < 2 ? 'Se necesitan al menos 2 jugadores' : ''}>
                  <Button 
                    onClick={onStartGame} 
                    disabled={state.players.length < 2}
                    variant="primary"
                    size="md"
                  >
                    Comenzar juego
                  </Button>
                </div>
                <Button onClick={onCopyLink} variant="outline" size="md">{isMobile ? 'Compartir enlace' : 'Copiar enlace'}</Button>
              </>
            )}
          </div>
          <div className="w-full mt-6">
            <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
          </div>
          {!isHost && (
            <div className="w-full mt-4">
              <Button onClick={onCopyLink} variant={state.players.length === 1 ? "primary" : "outline"} size="md">{isMobile ? 'Compartir enlace' : 'Copiar enlace'}</Button>
            </div>
          )}
          
          {/* Footer con código de sala */}
          <div className="w-full max-w-sm mx-auto mt-6 border-t border-white/10">
            <div className="space-y-0 divide-y divide-white/10">
              <div className="py-3">
                <Button onClick={() => setShowLeaveGameModal(true)} variant="ghost" size="md" className="gap-2 w-full">
                  <span>Abandonar juego</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              </div>
              <div className="pt-3">
                <button
                  onClick={() => onCopyGameCode()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150"
                  title="Copiar código"
                >
                  <span>Código de sala: <span className="font-mono font-semibold text-neutral-500">{state.gameId}</span></span>
                  {!isMobile && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar pantalla de playing si estamos en playing con datos completos, o esperando datos de resultado */}
      {((state.phase === 'playing' && state.role && state.currentTurn && state.maxTurns) || 
        (state.phase === 'round_result' && (!state.impostorName || !state.secretWord)) ||
        (state.phase === 'game_over' && state.winner === undefined)) && (
        <>
        {/* Overlay de carga cuando estamos esperando datos (solo si estamos en playing cargando datos) */}
        {(state.phase === 'playing' && (!state.role || !state.currentTurn)) && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
          </div>
        )}
        
        {/* Indicador de partida y ronda */}
        <div className={`w-full max-w-sm mx-auto mb-4 ${showRestOfUI ? 'animate-fadeIn animate-delay-200' : 'opacity-0 pointer-events-none'}`}>
          <p className="text-center text-xs text-neutral-500 mb-3">
            Partida {state.roundCount || 1} • Ronda {state.currentTurn} de {state.maxTurns}
          </p>
          {/* Stepper de rondas */}
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3].map((turn) => (
              <div 
                key={turn} 
                className={`w-2 h-2 rounded-full transition-all ${
                  state.currentTurn === turn 
                    ? 'bg-orange-500 scale-125' 
                    : state.currentTurn > turn
                    ? 'bg-green-500/50'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className={`w-full max-w-sm mx-auto text-center mb-5 ${showRestOfUI ? 'animate-fadeIn animate-delay-400' : 'opacity-0 pointer-events-none'}`}>
          <h2 className="text-2xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>Tu carta</h2>
        </div>
        <div className="w-full max-w-sm mx-auto space-y-3">
          <div className={`${showCardEntrance ? 'animate-cardEntrance' : ''}`}>
            <div className="flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full animate-card-float">
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
                        <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-neutral-300">
                          <span>Tu rol</span>
                        </div>
                        <p className="text-xl font-semibold mt-1 text-white" style={{fontFamily: 'Trocchi, serif'}}>{capitalize(state.role)}</p>
                      </div>
                      
                      {/* Línea separadora */}
                      <div className="w-full h-px bg-white/20"></div>
                      
                      {state.role === 'impostor' ? (
                        <>
                          {state.secretCategory && (
                            <div>
                              <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-neutral-200">
                                <span>Pista</span>
                              </div>
                              <p className="font-semibold text-xl mt-1 text-white underline decoration-dotted underline-offset-4" style={{fontFamily: 'Trocchi, serif'}}>
                                {capitalize(state.secretCategory)}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-neutral-200">
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
          </div>
          {/* Botón Girar carta */}
          <div className={`flex justify-center mt-6 ${showRestOfUI ? 'animate-fadeIn animate-delay-600' : 'opacity-0 pointer-events-none'}`}>
              <button
                onClick={triggerReveal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150 border border-neutral-600/30 hover:border-neutral-500/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Voltear carta</span>
              </button>
          </div>
        </div>
        
        <div className={`w-full max-w-sm mx-auto mt-4 ${showRestOfUI ? 'animate-fadeIn animate-delay-800' : 'opacity-0 pointer-events-none'}`}>
          <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
        </div>
        
        {isHost && (
          <div className={`w-full max-w-sm mx-auto mt-6 ${showRestOfUI ? 'animate-fadeIn animate-delay-1000' : 'opacity-0 pointer-events-none'}`}>
            <Button onClick={() => setShowEndGameModal(true)} variant="outline" size="md" className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20">Terminar juego</Button>
          </div>
        )}
        {/* Footer único y consistente */}
        <div className={`w-full max-w-sm mx-auto mt-6 border-t border-white/10 ${showRestOfUI ? 'animate-fadeIn animate-delay-1000' : 'opacity-0 pointer-events-none'}`}>
          <div className="space-y-0 divide-y divide-white/10">
            <div className="py-3">
              <Button onClick={() => setShowLeaveGameModal(true)} variant="ghost" size="md" className="gap-2 w-full">
                <span>Abandonar juego</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
            <div className="pt-3">
              <button
                onClick={() => onCopyGameCode()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150"
                title="Copiar código"
              >
                <span>Código de sala: <span className="font-mono font-semibold text-neutral-500">{state.gameId}</span></span>
                {!isMobile && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Resultado de partida */}
      {state.phase === 'round_result' && state.impostorName && state.secretWord && (
        <div className="fixed inset-0 z-40 bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="min-h-full w-full max-w-sm mx-auto px-4 pt-6 pb-24 space-y-6">
              <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
                {state.roundCount && state.maxRounds && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full">
                    <span className="text-sm font-semibold text-orange-400">
                      Partida {state.roundCount} de {state.maxRounds}
                    </span>
                  </div>
                )}
                <h2 className="text-3xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>
                  Resultado de la partida
                </h2>
              </div>
              
              {/* Revelar impostor y palabra */}
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-md animate-fadeIn animate-delay-400">
                <div className="space-y-6 text-center">
                  <div>
                    <span className="text-xs tracking-wider uppercase text-neutral-400">El impostor era</span>
                    {/* Avatar del impostor */}
                    <div className="flex justify-center my-4">
                      {state.players && (() => {
                        const impostor = state.players.find(p => p.uid === state.impostorId);
                        return impostor ? (
                          <Avatar photoURL={impostor.photoURL} displayName={impostor.name} size="lg" className="ring-4 ring-orange-400/50 shadow-lg" />
                        ) : null;
                      })()}
                    </div>
                    <p className="font-semibold text-2xl text-orange-400 mt-2" style={{fontFamily: 'Trocchi, serif'}}>
                      {state.impostorName}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <span className="text-xs tracking-wider uppercase text-neutral-400">Palabra secreta</span>
                    <p className="font-semibold text-2xl text-white mt-2" style={{fontFamily: 'Trocchi, serif'}}>
                      {capitalize(state.secretWord)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Puntuación */}
              <div className="bg-white/5 rounded-xl p-4 animate-fadeIn animate-delay-600">
                <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
              </div>
              
              {/* Botón o mensaje de espera */}
              {isHost ? (
                <div className="animate-fadeIn animate-delay-800">
                  <Button onClick={onPlayAgain} variant="primary" size="md" className="w-full">
                    Siguiente partida
                  </Button>
                </div>
              ) : (
                <div className="text-center text-neutral-400 text-sm animate-text-pulse animate-fadeIn animate-delay-800">
                  Esperando a que <span className="font-semibold text-neutral-300">{state.players.find(p => p.uid === state.hostId)?.name || 'el anfitrión'}</span> (anfitrión) <br />inicie la siguiente partida
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Fin del juego */}
      {state.phase === 'game_over' && state.winner !== undefined && (() => {
        // Calcular ganadores - buscar entre TODOS los jugadores que tienen puntos, no solo los conectados
        const isTie = state.winner === 'Empate';
        const playerScores = state.playerScores || {};
        const maxScore = Math.max(...Object.values(playerScores));
        
        // Crear lista de todos los jugadores (conectados + desconectados con puntos)
        const allPlayerUids = new Set([
          ...state.players.map(p => p.uid),
          ...Object.keys(playerScores)
        ]);
        
        const allPlayers = Array.from(allPlayerUids).map(uid => {
          const connectedPlayer = state.players.find(p => p.uid === uid);
          if (connectedPlayer) return connectedPlayer;
          // Si no está conectado, crear objeto básico con la info que tenemos
          return {
            uid,
            name: 'Jugador desconectado',
            photoURL: null
          };
        });
        
        const winnerPlayers = allPlayers.filter(player => (playerScores[player.uid] || 0) === maxScore);
        const winnerNames = winnerPlayers.map(p => p.name).join(' y ');
        
        return (
        <div className="fixed inset-0 z-40 bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="min-h-full w-full max-w-sm mx-auto px-4 py-6 space-y-6">
            <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
              <h2 className="text-4xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>
                Resultado final
              </h2>
            </div>
            
            {/* Caja de ganadores */}
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-md animate-fadeIn animate-delay-400">
              <div className="space-y-6 text-center">
                {winnerPlayers.length >= 3 ? (
                  // Sin ganadores (empate triple o mayor)
                  <div>
                    <span className="text-xs tracking-wider uppercase text-neutral-400">Resultado</span>
                    <p className="font-semibold text-2xl text-orange-400 mt-4" style={{fontFamily: 'Trocchi, serif'}}>
                      No hay ganadores
                    </p>
                    <p className="text-lg text-neutral-300 mt-2">¡Empieza otro juego!</p>
                  </div>
                ) : winnerPlayers.length === 2 ? (
                  // Dos ganadores
                  <div>
                    <span className="text-xs tracking-wider uppercase text-white">Ganadores</span>
                    <div className="flex justify-center gap-6 my-4">
                      {winnerPlayers.map(winner => (
                        <div key={winner.uid} className="flex flex-col items-center">
                          <Avatar photoURL={winner.photoURL} displayName={winner.name} size="lg" className="ring-4 ring-orange-400/50 shadow-lg" />
                          <p className="font-semibold text-lg text-orange-400 mt-2" style={{fontFamily: 'Trocchi, serif'}}>
                            {winner.name}
                          </p>
                          <p className="text-sm text-neutral-400 mt-1">
                            {playerScores[winner.uid] || 0} pts
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : winnerPlayers.length === 1 ? (
                  // Un ganador
                  <div>
                    <span className="text-xs tracking-wider uppercase text-white">Ganador</span>
                    <div className="flex justify-center my-4">
                      <Avatar photoURL={winnerPlayers[0].photoURL} displayName={winnerPlayers[0].name} size="lg" className="ring-4 ring-orange-400/50 shadow-lg" />
                    </div>
                    <p className="font-semibold text-2xl text-orange-400 mt-2" style={{fontFamily: 'Trocchi, serif'}}>
                      {winnerPlayers[0].name}
                    </p>
                    <p className="text-lg text-neutral-400 mt-2">
                      {playerScores[winnerPlayers[0].uid] || 0} pts
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Puntuación final - solo mostrar si hay jugadores además de los ganadores */}
            {allPlayers.filter(p => !winnerPlayers.some(w => w.uid === p.uid)).length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 animate-fadeIn animate-delay-400">
                <PlayerList 
                  players={allPlayers.filter(p => !winnerPlayers.some(w => w.uid === p.uid))} 
                  currentUserId={user.uid} 
                  isHost={isHost} 
                  onCopyLink={onCopyLink} 
                  gameState={state} 
                  onVote={onVote} 
                />
              </div>
            )}
            
            {isHost && (
              <div className="animate-fadeIn animate-delay-600">
                <Button 
                  onClick={() => {
                    console.log('🎮 Click en Nuevo Juego', { gameId: state.gameId, isHost });
                    onPlayAgain();
                  }} 
                  variant="primary" 
                  size="md"
                >
                  Nuevo juego
                </Button>
              </div>
            )}
            
            {/* Footer */}
            <div className="border-t border-white/10 space-y-0 divide-y divide-white/10 animate-fadeIn animate-delay-800">
              <div className="py-3">
                <Button onClick={() => setShowLeaveGameModal(true)} variant="ghost" size="md" className="gap-2 w-full">
                  <span>Abandonar juego</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              </div>
              <div className="pt-3">
                <button
                  onClick={() => onCopyGameCode()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-neutral-500 hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-3xl transition-all duration-150"
                  title="Copiar código"
                >
                  <span>Código de sala: <span className="font-mono font-semibold text-neutral-500">{state.gameId}</span></span>
                  {!isMobile && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
        );
      })()}
      
      {/* Overlay de nueva ronda */}
      {showTurnOverlay && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm px-4 transition-opacity duration-300 ${isOverlayClosing ? 'opacity-0' : 'animate-fadeIn'}`}>
          <div className={`text-center space-y-8 max-w-md transition-all duration-300 ${isOverlayClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'}`}>
            <h2 className="text-4xl font-bold text-orange-400" style={{fontFamily: 'Trocchi, serif'}}>
              Ronda {state.currentTurn}
            </h2>
            
            {eliminatedPlayerInfo ? (
              <div className="space-y-7">
                <div className="flex flex-col items-center gap-4">
                  <Avatar photoURL={eliminatedPlayerInfo.photoURL} displayName={eliminatedPlayerInfo.name} size="xl" className="ring-4 ring-red-500/50" />
                  <p className="text-2xl text-neutral-300">
                    <span className="text-red-400">{eliminatedPlayerInfo.name}</span> fue eliminado
                  </p>
                </div>
                <p className="text-3xl text-neutral-200">
                  El impostor sigue entre nosotros
                </p>
              </div>
            ) : (
              <div className="space-y-7">
                <p className="text-3xl text-neutral-200">
                  Nadie ha sido eliminado
                </p>
                <p className="text-2xl text-neutral-400">
                  Nueva ronda de pistas
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación para terminar juego */}
      {showEndGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 rounded-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-neutral-50">¿Terminar juego?</h3>
              <p className="text-neutral-400">
                Esta acción finalizará el juego para todos los jugadores. ¿Estás seguro?
              </p>
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => setShowEndGameModal(false)} 
                  variant="outline" 
                  size="md" 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    setShowEndGameModal(false);
                    onEndGame();
                  }} 
                  variant="primary" 
                  size="md" 
                  className="flex-1"
                >
                  Terminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para abandonar juego */}
      {showLeaveGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neutral-900 rounded-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-neutral-50">¿Abandonar juego?</h3>
              <p className="text-neutral-400">
                Saldrás del juego y volverás al lobby. ¿Estás seguro?
              </p>
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => setShowLeaveGameModal(false)} 
                  variant="outline" 
                  size="md" 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    setShowLeaveGameModal(false);
                    onLeaveGame();
                  }} 
                  variant="primary" 
                  size="md" 
                  className="flex-1"
                >
                  Abandonar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
