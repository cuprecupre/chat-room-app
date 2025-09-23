import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(user) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const attemptedResumeRef = useRef(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        console.log('Disconnecting socket...');
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
      if (socketRef.current || !isMounted) return;

      try {
        const token = await user.getIdToken();
        if (!isMounted) return; 

        console.log('Connecting socket...');
        const socketURL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3000';
        const socket = io(socketURL, {
          auth: { token, name: user.displayName, photoURL: user.photoURL },
          reconnection: true,
          reconnectionAttempts: 5
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Socket connected');
          if (isMounted) setConnected(true);
          attemptedResumeRef.current = false; // fresh session
          const urlParams = new URLSearchParams(window.location.search);
          const gameIdFromUrl = urlParams.get('gameId');
          if (gameIdFromUrl && !attemptedResumeRef.current) {
            attemptedResumeRef.current = true;
            socket.emit('join-game', gameIdFromUrl);
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

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          if (isMounted) {
            setConnected(false);
            // Don't clear gameState on disconnect - keep it for reconnection
            attemptedResumeRef.current = false;
          }
        });

        socket.on('game-state', (newState) => {
          console.log('[Socket] Received game-state:', newState ? { phase: newState.phase, role: newState.role } : null);
          if (isMounted) setGameState(newState);
          const url = new URL(window.location);
          if (newState?.gameId) {
            url.searchParams.set('gameId', newState.gameId);
            window.history.replaceState({}, '', url.toString());
          } else {
            const urlGameId = url.searchParams.get('gameId');
            if (urlGameId && !attemptedResumeRef.current) {
              console.log('[Socket] Attempting resume via URL gameId:', urlGameId);
              attemptedResumeRef.current = true;
              socket.emit('join-game', urlGameId);
            } else {
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
        });

      } catch (error) {
        console.error('Failed to get Firebase token for socket connection:', error);
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
