import React, { useEffect, useRef, useState } from 'react';
// removed icons from labels
import { Button } from './ui/Button';
import keyImg from '../assets/llave.png';
import dualImpostorImg from '../assets/dual-impostor.png';
import cardImg from '../assets/card.png';
import cardBackImg from '../assets/card-back.png';

function PlayerList({ players, currentUserId, isHost, onCopyLink, gameState, onVote }) {
  const isPlaying = gameState?.phase === 'playing';
  const isRoundResult = gameState?.phase === 'round_result';
  const isGameOver = gameState?.phase === 'game_over';
  const showScores = isRoundResult || isGameOver;
  
  const canVote = isPlaying && gameState?.canVote && !gameState?.hasVoted;
  const votedPlayers = gameState?.votedPlayers || [];
  const eliminatedPlayers = gameState?.eliminatedInRound || [];
  const activePlayers = gameState?.activePlayers || [];
  const myVote = gameState?.myVote || null; // A quién voté yo
  const playerScores = gameState?.playerScores || {};
  const lastRoundScores = gameState?.lastRoundScores || {};
  
  // Detectar ganadores en caso de empate
  const isTie = gameState?.winner === 'Empate';
  const winners = isTie ? (() => {
    const maxScore = Math.max(...Object.values(playerScores));
    return players.filter(player => (playerScores[player.uid] || 0) === maxScore);
  })() : [];
  
  // Si hay 3 o más ganadores, no hay ganadores reales
  const hasNoWinners = winners.length >= 3;
  
  // Ordenar jugadores: usuario actual siempre primero (excepto en scores)
  const sortedPlayers = [...players]
    .sort((a, b) => {
      // Si mostramos puntos, ordenar por puntuación
      if (showScores) {
        return (playerScores[b.uid] || 0) - (playerScores[a.uid] || 0);
      }
      // Usuario actual siempre primero
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
  let headerText = isPlaying ? 'Vota por un jugador' : `Jugadores Conectados: ${players.length}`;
  if (showScores) {
    headerText = isGameOver ? 'Puntuación Final' : 'Puntuación';
  }

  return (
    <div className="w-full rounded-lg">
      <p className={`mb-3 ${isPlaying || showScores ? 'text-base font-regular text-neutral-200 text-center' : 'text-sm font-regular text-neutral-500'}`}>
        {headerText}
      </p>
      <ul className="space-y-2">
        {sortedPlayers.map((p, index) => {
          const isEliminated = eliminatedPlayers.includes(p.uid);
          const hasVoted = votedPlayers.includes(p.uid);
          const showVoteButton = canVoteFor(p.uid);
          const iVotedForThisPlayer = isMyVote(p.uid);
          const score = playerScores[p.uid] || 0;
          const scoreGained = lastRoundScores[p.uid] || 0;
          const isWinner = isGameOver && !hasNoWinners && (index === 0 || (isTie && winners.some(w => w.uid === p.uid)));
          
          return (
            <li key={p.uid} className={`flex items-center justify-between bg-white/5 p-4 rounded-md ${isEliminated ? 'opacity-50' : ''} ${isWinner ? 'bg-orange-500/10' : ''}`}>
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
                  <div>
                    <span className={`font-medium ${isWinner ? 'text-orange-400' : ''}`}>
                      {p.name}{p.uid === currentUserId ? ' (Tú)' : ''}
                    </span>
                    {isEliminated && <span className="text-xs text-neutral-500 ml-2">(Eliminado)</span>}
                  </div>
                </div>
              </div>
              
              {/* Mostrar puntos o botón de votar según fase */}
              {showScores ? (
                <div className="text-right">
                  <span className={`font-medium ${isWinner ? 'text-orange-400' : 'text-neutral-300'}`}>
                    {score} pts
                  </span>
                  {isRoundResult && scoreGained > 0 && (
                    <div className="text-xs text-green-400 font-medium mt-0.5">
                      +{scoreGained}
                    </div>
                  )}
                </div>
              ) : (showVoteButton || iVotedForThisPlayer) && (
                <Button
                  onClick={() => onVote(p.uid)}
                  variant="outline"
                  size="sm"
                  disabled={iVotedForThisPlayer}
                  className={`!w-auto gap-2 px-4 ${
                    iVotedForThisPlayer 
                      ? '!border-green-500 !text-green-400 !bg-green-500/10 !hover:bg-green-500/10 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                  <span>{iVotedForThisPlayer ? 'Votado' : 'Votar'}</span>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GameRoom({ state, isHost, user, onStartGame, onEndGame, onPlayAgain, onLeaveGame, onCopyLink, onCopyGameCode, onVote }) {
  const capitalize = (s) => (typeof s === 'string' && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const prevPlayersRef = useRef(state.players);
  const prevTurnRef = useRef(state.currentTurn);
  const prevPhaseRef = useRef(state.phase);
  const [reveal, setReveal] = useState(false);
  const [showTurnOverlay, setShowTurnOverlay] = useState(false);
  const [isOverlayClosing, setIsOverlayClosing] = useState(false);
  const [eliminatedPlayerInfo, setEliminatedPlayerInfo] = useState(null);
  const [showCardEntrance, setShowCardEntrance] = useState(false);
  const revealTimeoutRef = useRef(null);
  const turnOverlayTimeoutRef = useRef(null);

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
    setReveal(!reveal); // Toggle entre mostrar/ocultar
  };


  // Detectar cambio de ronda y mostrar overlay
  useEffect(() => {
    const prevTurn = prevTurnRef.current;
    const currentTurn = state.currentTurn;
    
    // Si la ronda cambió y es ronda 2 o superior (nueva ronda), mostrar overlay y resetear carta
    if (state.phase === 'playing' && prevTurn && currentTurn > prevTurn && currentTurn > 1) {
      // Resetear carta al estado frontal
      setReveal(false);
      
      // Buscar al último jugador eliminado
      const eliminatedIds = state.eliminatedInRound || [];
      if (eliminatedIds.length > 0) {
        const lastEliminatedId = eliminatedIds[eliminatedIds.length - 1];
        const eliminatedPlayer = state.players.find(p => p.uid === lastEliminatedId);
        setEliminatedPlayerInfo(eliminatedPlayer || null);
      } else {
        setEliminatedPlayerInfo(null);
      }
      
      setShowTurnOverlay(true);
      setIsOverlayClosing(false);
      
      // Iniciar animación de salida después de 1.7 segundos
      if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
      turnOverlayTimeoutRef.current = setTimeout(() => {
        setIsOverlayClosing(true);
        
        // Ocultar completamente después de la animación (300ms)
        setTimeout(() => {
          setShowTurnOverlay(false);
          setIsOverlayClosing(false);
          setEliminatedPlayerInfo(null);
        }, 300);
      }, 1700);
    }
    
    prevTurnRef.current = currentTurn;
  }, [state.currentTurn, state.phase, state.eliminatedInRound, state.players]);
  
  // Resetear carta cuando empieza una nueva partida (playing)
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const currentPhase = state.phase;
    
    // Si pasamos a playing desde otra fase, resetear carta
    if (currentPhase === 'playing' && prevPhase !== 'playing') {
      setReveal(false);
      
      // Mostrar animación de entrada si viene del lobby o game_over
      const shouldShowAnimation = prevPhase === 'lobby' || prevPhase === 'game_over';
      
      if (shouldShowAnimation) {
        setShowCardEntrance(true);
        
        // Quitar la animación después de que termine
        setTimeout(() => {
          setShowCardEntrance(false);
        }, 800);
      }
    }
    
    prevPhaseRef.current = currentPhase;
  }, [state.phase]);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (turnOverlayTimeoutRef.current) clearTimeout(turnOverlayTimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center space-y-6">

      {state.phase === 'lobby' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <img src={dualImpostorImg} alt="Esperando jugadores" className="mx-auto w-48 h-48 sm:w-48 sm:h-48 rounded-full object-cover shadow-lg ring-1 ring-white/10" loading="lazy" />
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
                <Button onClick={onCopyLink} variant="outline" size="md">Copiar enlace</Button>
              </>
            )}
          </div>
          <div className="w-full mt-6">
            <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
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
                <span>Abandonar juego</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
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
        <div className="w-full max-w-sm mx-auto mb-4">
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
        
        <div className="w-full max-w-sm mx-auto text-center mb-5">
          <h2 className="text-2xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>Tu carta</h2>
        </div>
        <div className="w-full max-w-sm mx-auto space-y-3">
          <div className={`flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full ${showCardEntrance ? 'animate-cardEntrance' : ''}`}>
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
                            <div>
                              <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-gray-200">
                                <span>Pista</span>
                              </div>
                              <p className="font-semibold text-xl mt-1 text-white" style={{fontFamily: 'Trocchi, serif'}}>
                                {capitalize(state.secretCategory)}
                              </p>
                            </div>
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
                <span>Voltear carta</span>
              </button>
          </div>
        </div>
        
        <div className="w-full max-w-sm mx-auto mt-4">
          <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
        </div>
        
        {isHost && (
          <div className="w-full max-w-sm mx-auto mt-6">
            <Button onClick={onEndGame} variant="outline" size="md" className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20">Terminar juego</Button>
          </div>
        )}
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
              <span>Abandonar juego</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
        </>
      )}

      {/* Resultado de partida */}
      {state.phase === 'round_result' && state.impostorName && state.secretWord && (
        <div className="fixed inset-0 z-40 bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="min-h-full w-full max-w-sm mx-auto px-4 py-6 space-y-6">
            <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
              <h2 className="text-4xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>
                Resultado de la partida
              </h2>
              {state.roundCount && state.maxRounds && (
                <p className="text-sm text-neutral-400">
                  Partida {state.roundCount}/{state.maxRounds} • Objetivo: {state.targetScore} puntos
                </p>
              )}
            </div>
            
            {/* Revelar impostor y palabra */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-md animate-fadeIn animate-delay-400">
              <div className="space-y-6 text-center">
                <div>
                  <span className="text-xs tracking-wider uppercase text-neutral-400">El impostor era</span>
                  {/* Avatar del impostor */}
                  <div className="flex justify-center my-4">
                    {state.players && (() => {
                      const impostor = state.players.find(p => p.name === state.impostorName);
                      return impostor ? (
                        <img 
                          src={impostor.photoURL} 
                          alt={impostor.name}
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-orange-400/50 shadow-lg"
                        />
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
            
            {isHost ? (
              <div className="animate-fadeIn animate-delay-800">
                <Button onClick={onPlayAgain} variant="primary" size="md">Siguiente partida</Button>
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
        // Calcular ganadores
        const isTie = state.winner === 'Empate';
        const playerScores = state.playerScores || {};
        const maxScore = Math.max(...Object.values(playerScores));
        const winnerPlayers = state.players.filter(player => (playerScores[player.uid] || 0) === maxScore);
        const winnerNames = winnerPlayers.map(p => p.name).join(' y ');
        
        return (
        <div className="fixed inset-0 z-40 bg-neutral-950/95 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="min-h-full w-full max-w-sm mx-auto px-4 py-6 space-y-6">
            <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
              <h2 className="text-4xl font-bold text-neutral-50" style={{fontFamily: 'Trocchi, serif'}}>
                ¡Juego terminado!
              </h2>
            </div>
            
            {/* Caja de ganadores */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-md animate-fadeIn animate-delay-400">
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
                    <span className="text-xs tracking-wider uppercase text-orange-400">Ganadores</span>
                    <div className="flex justify-center gap-6 my-4">
                      {winnerPlayers.map(winner => (
                        <div key={winner.uid} className="flex flex-col items-center">
                          <img 
                            src={winner.photoURL} 
                            alt={winner.name}
                            className="w-20 h-20 rounded-full object-cover ring-4 ring-orange-400/50 shadow-lg"
                          />
                          <p className="font-semibold text-lg text-orange-400 mt-2" style={{fontFamily: 'Trocchi, serif'}}>
                            {winner.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : winnerPlayers.length === 1 ? (
                  // Un ganador
                  <div>
                    <span className="text-xs tracking-wider uppercase text-orange-400">Ganador</span>
                    <div className="flex justify-center my-4">
                      <img 
                        src={winnerPlayers[0].photoURL} 
                        alt={winnerPlayers[0].name}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-orange-400/50 shadow-lg"
                      />
                    </div>
                    <p className="font-semibold text-2xl text-orange-400 mt-2" style={{fontFamily: 'Trocchi, serif'}}>
                      {winnerPlayers[0].name}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Puntuación final */}
            <div className="bg-white/5 rounded-xl p-4 animate-fadeIn animate-delay-400">
              <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
            </div>
            
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
            <div className="pt-4 border-t border-white/10 space-y-3 animate-fadeIn animate-delay-800">
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
                <span>Abandonar juego</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
            </div>
          </div>
        </div>
        );
      })()}
      
      {/* Overlay de nueva ronda */}
      {showTurnOverlay && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm px-4 transition-opacity duration-300 ${isOverlayClosing ? 'opacity-0' : 'animate-fadeIn'}`}>
          <div className={`text-center space-y-6 max-w-sm transition-all duration-300 ${isOverlayClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'}`}>
            <h2 className="text-6xl font-bold text-orange-400" style={{fontFamily: 'Trocchi, serif'}}>
              Ronda {state.currentTurn}
            </h2>
            
            {eliminatedPlayerInfo && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <img 
                      src={eliminatedPlayerInfo.photoURL} 
                      alt={eliminatedPlayerInfo.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-red-500/50"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="w-20 h-20 rounded-full bg-neutral-600 flex items-center justify-center text-white text-lg font-semibold ring-4 ring-red-500/50"
                      style={{display: 'none'}}
                    >
                      {eliminatedPlayerInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  </div>
                  <p className="text-lg text-neutral-300">
                    <span className="font-semibold text-red-400">{eliminatedPlayerInfo.name}</span> fue eliminado
                  </p>
                </div>
                <p className="text-xl text-neutral-200 font-medium">
                  El impostor sigue entre nosotros
                </p>
              </div>
            )}
            
            {!eliminatedPlayerInfo && (
              <p className="text-xl text-neutral-300">
                {state.currentTurn === state.maxTurns ? '¡Última ronda!' : 'Continúa votando'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
