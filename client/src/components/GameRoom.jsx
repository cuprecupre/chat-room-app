import React, { useEffect, useRef, useState } from 'react';
import { Link, Share } from 'lucide-react';
// removed icons from labels
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Footer } from './Footer';
import { PlayerList } from './PlayerList';
import dualImpostorImg from '../assets/dual-impostor.png';
import cardImg from '../assets/card.png';
import cardBackImg from '../assets/card-back.png';

export function GameRoom({ state, isHost, user, onStartGame, onEndGame, onPlayAgain, onLeaveGame, onCopyLink, onVote, isMobile, showEndGameModal: showEndGameModalProp, onShowEndGameModal }) {
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
  const [showEndGameModalInternal, setShowEndGameModalInternal] = useState(false);

  // Usar props si están definidas, sino usar estado interno
  const showEndGameModal = showEndGameModalProp !== undefined ? showEndGameModalProp : showEndGameModalInternal;
  const setShowEndGameModal = onShowEndGameModal || setShowEndGameModalInternal;
  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
  const [cardAnimating, setCardAnimating] = useState(false); // Controla si la animación está activa
  const revealTimeoutRef = useRef(null);
  const turnOverlayTimeoutRef = useRef(null);
  const restUITimeoutRef = useRef(null);
  const cardFloatTimeoutRef = useRef(null);

  // Referencia para tracking de jugadores (sin toast - el servidor lo maneja)
  useEffect(() => {
    prevPlayersRef.current = state.players;
  }, [state.players]);


  // Detectar cambio de fase para resetear scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.phase]);

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
      if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
    };
  }, []);

  // Iniciar animación de carta al entrar en fase playing
  useEffect(() => {
    if (state.phase === 'playing') {
      setCardAnimating(true);

      // La animación dura 7s y se detiene sola (forwards)
      // Actualizar estado después de 7s para limpiar
      if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
      cardFloatTimeoutRef.current = setTimeout(() => {
        setCardAnimating(false);
      }, 7000);
    }

    return () => {
      if (cardFloatTimeoutRef.current) clearTimeout(cardFloatTimeoutRef.current);
    };
  }, [state.phase]);

  return (
    <div className="w-full flex flex-col items-center space-y-6">

      {state.phase === 'lobby' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4 pb-24 sm:pb-0">
          {/* Header Image - 50% smaller (w-28 h-28) */}
          <img src={dualImpostorImg} alt="Lobby" className="mx-auto w-28 h-28 rounded-full object-cover shadow-lg ring-1 ring-white/10" loading="lazy" />

          {isHost ? (
            /* HOST VIEW */
            <>
              <h2 className="text-3xl font-serif text-neutral-50 leading-tight">Invita a tus amigos<br />para empezar</h2>

              <div className="w-full space-y-4">
                <Button onClick={onCopyLink} variant="outline" size="md" className="border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2">
                  {isMobile ? <Share className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                  {isMobile ? 'Compartir invitación' : 'Copiar enlace de la partida'}
                </Button>

                <p className="text-lg text-neutral-400 font-regular">
                  Espera a que se unan los jugadores...
                </p>

                <div className="w-full pt-2">
                  <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
                </div>

                {/* Botón fijo en mobile, normal en desktop */}
                <div className="hidden sm:block">
                  <Button
                    onClick={onStartGame}
                    disabled={state.players.length < 2}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Comenzar juego
                  </Button>
                </div>
              </div>

              {/* Botón fijo solo en mobile */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent sm:hidden z-40">
                <div className="max-w-sm mx-auto">
                  <Button
                    onClick={onStartGame}
                    disabled={state.players.length < 2}
                    variant="primary"
                    size="md"
                    className="w-full shadow-lg"
                  >
                    Comenzar juego
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* GUEST VIEW */
            <>
              <h2 className="text-3xl font-serif text-neutral-50 leading-tight">La partida empezará pronto</h2>

              <div className="space-y-6">
                <p className="text-lg text-neutral-400 animate-pulse">
                  Espera hasta que <span className="text-orange-400 font-regular">{state.players.find(p => p.uid === state.hostId)?.name || 'el anfitrión'}</span> inicie la partida.
                </p>

                <div className="w-full">
                  <PlayerList players={state.players} currentUserId={user.uid} isHost={isHost} onCopyLink={onCopyLink} gameState={state} onVote={onVote} />
                </div>

                <div className="pt-4 space-y-3">
                  <p className="text-sm text-neutral-500">También puedes invitar amigos a esta partida</p>
                  <Button onClick={onCopyLink} variant="outline" size="md" className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10 active:bg-orange-500/20 gap-2">
                    {isMobile ? <Share className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                    {isMobile ? 'Compartir invitación' : 'Copiar enlace de la partida'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )
      }

      {/* Mostrar pantalla de playing si estamos en playing con datos completos, o esperando datos de resultado */}
      {
        ((state.phase === 'playing' && state.role && state.currentTurn && state.maxTurns) ||
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
                    className={`w-2 h-2 rounded-full transition-all ${state.currentTurn === turn
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
              <h2 className="text-2xl font-serif text-neutral-50">Tu carta</h2>
            </div>
            <div className="w-full max-w-sm mx-auto space-y-3">
              <div className={`${showCardEntrance ? 'animate-cardEntrance' : ''}`}>
                <div className={`flip-card relative z-10 pointer-events-auto aspect-[4/3] w-full ${cardAnimating ? 'animate-card-float-complete' : ''}`}>
                  <div className={`flip-card-inner h-full cursor-pointer ${reveal ? 'is-flipped' : ''}`} onClick={triggerReveal} title="Toca para voltear la carta">
                    {/* Frente completo (card completa con imagen) */}
                    <div className="flip-card-front">
                      <div className="h-full flex items-center justify-center">
                        <img
                          src={cardImg}
                          alt="Frente de la carta"
                          className="w-full h-full object-cover rounded-xl pointer-events-none"
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
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />
                        {/* Contenido sobre la imagen */}
                        <div
                          className="relative z-10 text-center p-8 backdrop-blur-sm rounded-xl pointer-events-none"
                          title="Volver al frente"
                        >
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-orange-400">
                                <span>Tu rol</span>
                              </div>
                              <p className="text-xl font-serif mt-1 text-white">{capitalize(state.role)}</p>
                            </div>

                            {/* Línea separadora */}
                            <div className="w-full h-px bg-white/20"></div>

                            {state.role === 'impostor' ? (
                              <>
                                {state.secretCategory && (
                                  <div>
                                    <div className="flex flex-col items-center justify-center gap-1 text-xs tracking-wider text-orange-400">
                                      <span className="uppercase">Pista:</span>
                                      <span className="normal-case">La palabra secreta está relacionada con...</span>
                                    </div>
                                    <p className="font-serif text-xl mt-1 text-white underline decoration-dotted underline-offset-4">
                                      {capitalize(state.secretCategory)}
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div>
                                <div className="flex items-center justify-center gap-2 text-xs tracking-wider uppercase text-orange-400">
                                  <span>Palabra secreta</span>
                                </div>
                                <p className="font-serif text-xl mt-1 text-white">
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



          </>
        )
      }

      {/* Resultado de partida */}
      {
        state.phase === 'round_result' && state.impostorName && state.secretWord && (
          <div className="w-full max-w-sm mx-auto animate-fadeIn">
            <div className="w-full px-4 py-6 space-y-6">
              <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
                {state.roundCount && state.maxRounds && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full">
                    <span className="text-sm font-semibold text-orange-400">
                      Partida {state.roundCount} de {state.maxRounds}
                    </span>
                  </div>
                )}
                <h2 className="text-3xl font-serif text-neutral-50">
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
                    <p className="font-serif text-2xl text-orange-400 mt-2">
                      {state.impostorName}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <span className="text-xs tracking-wider uppercase text-neutral-400">Palabra secreta</span>
                    <p className="font-serif text-2xl text-white mt-2">
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
                <div className="space-y-3 animate-fadeIn animate-delay-800">
                  <Button onClick={onPlayAgain} variant="primary" size="md" className="w-full">
                    Siguiente partida
                  </Button>
                  <Button onClick={() => setShowLeaveGameModal(true)} variant="ghost" size="md" className="w-full gap-2">
                    <span>Abandonar juego</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn animate-delay-800">
                  <div className="text-center text-neutral-400 text-sm animate-text-pulse">
                    Esperando a que el anfitrión (<span className="font-semibold text-neutral-300">{state.players.find(p => p.uid === state.hostId)?.name || 'desconocido'}</span>) <br />inicie la siguiente partida
                  </div>
                  <Button onClick={() => setShowLeaveGameModal(true)} variant="ghost" size="md" className="w-full gap-2">
                    <span>Abandonar juego</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </Button>
                </div>
              )}

              {/* Divider para separar del footer */}
              <div className="w-full h-px bg-neutral-800 mt-10"></div>
            </div>
          </div>
        )
      }

      {/* Fin del juego */}
      {
        state.phase === 'game_over' && state.winner !== undefined && (() => {
          // Calcular ganadores - buscar entre TODOS los jugadores que tienen puntos, no solo los conectados
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
            // Si no está conectado, buscar en formerPlayers
            const formerPlayer = state.formerPlayers?.[uid];
            return {
              uid,
              name: formerPlayer?.name || 'Jugador desconectado',
              photoURL: formerPlayer?.photoURL || null
            };
          });

          const winnerPlayers = allPlayers.filter(player => (playerScores[player.uid] || 0) === maxScore);

          return (
            <div className="w-full max-w-sm mx-auto animate-fadeIn">
              <div className="w-full px-4 py-6 space-y-6">
                <div className="text-center space-y-4 animate-scaleIn animate-delay-200">
                  <h2 className="text-4xl font-serif text-neutral-50">
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
                        <p className="font-serif text-2xl text-orange-400 mt-4">
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
                              <p className="font-serif text-lg text-orange-400 mt-2">
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
                        <p className="font-serif text-2xl text-orange-400 mt-2">
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
              </div>
            </div>
          );
        })()
      }

      {/* Overlay de nueva ronda */}
      {
        showTurnOverlay && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-sm px-4 transition-opacity duration-300 ${isOverlayClosing ? 'opacity-0' : 'animate-fadeIn'}`}>
            <div className={`text-center space-y-8 max-w-md transition-all duration-300 ${isOverlayClosing ? 'opacity-0 scale-95' : 'animate-scaleIn'}`}>
              <h2 className="text-6xl font-serif text-orange-400">
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
        )
      }

      {/* Modal de confirmación para terminar juego */}
      {
        showEndGameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-neutral-900 rounded-xl p-6 mx-4 max-w-sm w-full">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-serif text-neutral-50">¿Finalizar juego?</h3>
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
        )
      }

      {/* Modal de confirmación para abandonar juego */}
      {
        showLeaveGameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-neutral-900 rounded-xl p-6 mx-4 max-w-sm w-full">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-serif text-neutral-50">¿Abandonar juego?</h3>
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
        )
      }
    </div >
  );
}
