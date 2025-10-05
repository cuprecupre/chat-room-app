import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(user) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const attemptedResumeRef = useRef(false);
  const hasLoggedWaitingDisplayName = useRef(false);

  useEffect(() => {
    // No conectar socket si el usuario no tiene displayName
    // (puede pasar al registrarse con email mientras se actualiza el perfil)
    if (user && !user.displayName) {
      if (!hasLoggedWaitingDisplayName.current) {
        console.log('⏳ useSocket - Esperando displayName...');
        hasLoggedWaitingDisplayName.current = true;
      }
      return;
    } else {
      hasLoggedWaitingDisplayName.current = false;
    }
    
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setGameState(null);
      attemptedResumeRef.current = false;
      return;
    }

    let isMounted = true;

    const connectSocket = async () => {
      if (socketRef.current || !isMounted) {
        return;
      }

      try {
        const token = await user.getIdToken();
        if (!isMounted) return;
        
        // En desarrollo, usar el mismo host que la URL actual pero puerto 3000
        const socketURL = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : `${window.location.protocol}//${window.location.hostname}:3000`;
        
        const socket = io(socketURL, {
          auth: { token, name: user.displayName, photoURL: user.photoURL },
          reconnection: true,
          reconnectionAttempts: 5
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('✅ Socket conectado:', user.displayName);
          if (isMounted) setConnected(true);
          attemptedResumeRef.current = false; // fresh session
          const urlParams = new URLSearchParams(window.location.search);
          const gameIdFromUrl = urlParams.get('gameId');
          if (gameIdFromUrl && !attemptedResumeRef.current) {
            attemptedResumeRef.current = true;
            // Intento de reanudar sesión
            socket.emit('join-game', gameIdFromUrl);
            // Si en 2s no llega estado, forzar UI de recuperación
            if (socket.resumeTimer) clearTimeout(socket.resumeTimer);
            socket.resumeTimer = setTimeout(() => {
              if (!socketRef.current) return;
              console.log('[Socket] Resume timeout, mostrando UI de unión');
              // No borrar el gameId de la URL: App mostrará la UI de unión/limpieza
              if (isMounted) setGameState(null);
            }, 2000);
          }
          
          // Start heartbeat to keep connection alive
          const heartbeatInterval = setInterval(() => {
            if (socket.connected) {
              socket.emit('heartbeat');
            } else {
              clearInterval(heartbeatInterval);
            }
          }, 30000); // Send heartbeat every 30 seconds
          
          // Store interval for cleanup
          socket.heartbeatInterval = heartbeatInterval;
        });

        socket.on('disconnect', (reason) => {
          console.log('🔌 useSocket - Socket desconectado. Razón:', reason);
          if (isMounted) {
            setConnected(false);
            // Don't clear gameState on disconnect - keep it for reconnection
            attemptedResumeRef.current = false;
          }
        });

        socket.on('connect_error', (error) => {
          console.error('❌ useSocket - Error de conexión del socket:', {
            message: error.message,
            type: error.type,
            description: error.description,
            context: error.context,
          });
        });

        socket.on('game-state', (newState) => {
          console.log('[Socket] Received game-state:', newState ? { phase: newState.phase, role: newState.role } : null);
          if (isMounted) setGameState(newState);
          if (socket.resumeTimer) {
            clearTimeout(socket.resumeTimer);
            socket.resumeTimer = null;
          }
          const url = new URL(window.location);
          if (newState?.gameId) {
            url.searchParams.set('gameId', newState.gameId);
            window.history.replaceState({}, '', url.toString());
          } else {
            const urlGameId = url.searchParams.get('gameId');
            // Do not auto-join here; let App render recovery UI if mismatch
            if (!urlGameId) {
              url.searchParams.delete('gameId');
              window.history.replaceState({}, '', url.toString());
            }
          }
        });

        // Add reconnection recovery
        socket.on('reconnect', () => {
          console.log('Socket reconnected, attempting to resume...');
          const urlParams = new URLSearchParams(window.location.search);
          const gameIdFromUrl = urlParams.get('gameId');
          if (gameIdFromUrl && !attemptedResumeRef.current) {
            attemptedResumeRef.current = true;
            socket.emit('join-game', gameIdFromUrl);
          }
        });

        socket.on('error-message', (message) => {
          console.error('Server error:', message);
          window.dispatchEvent(new CustomEvent('app:toast', { detail: message }));
          
          // Si la sala no existe, no perteneces, o partida en curso, limpiar estado y URL para evitar quedar bloqueado
          if (/no existe|no perteneces|partida en curso/i.test(message)) {
            const url = new URL(window.location);
            url.searchParams.delete('gameId');
            window.history.replaceState({}, '', url.toString());
            if (isMounted) setGameState(null);
          }
        });

        socket.on('session-replaced', (message) => {
          console.log('Session replaced:', message);
          window.dispatchEvent(new CustomEvent('app:toast', { detail: message }));
          // Clear game state and redirect to lobby
          if (isMounted) {
            setGameState(null);
            setConnected(false);
            const url = new URL(window.location);
            url.searchParams.delete('gameId');
            window.history.replaceState({}, '', url.toString());
          }
        });

      } catch (error) {
        console.error('❌ useSocket - Error al obtener token de Firebase para socket:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        console.log('Cleaning up socket connection...');
        // Clear heartbeat interval
        if (socketRef.current.heartbeatInterval) {
          clearInterval(socketRef.current.heartbeatInterval);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const emit = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { connected, gameState, emit };
}
