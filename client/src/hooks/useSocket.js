import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(user) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        console.log('Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setState(null);
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
          const urlParams = new URLSearchParams(window.location.search);
          const gameIdFromUrl = urlParams.get('gameId');
          if (gameIdFromUrl) {
            socket.emit('join-game', gameIdFromUrl);
          }
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          if (isMounted) {
            setConnected(false);
            setState(null);
          }
        });

        socket.on('game-state', (newState) => {
          if (isMounted) setState(newState);
          const url = new URL(window.location);
          if (newState?.gameId) {
            url.searchParams.set('gameId', newState.gameId);
          } else {
            url.searchParams.delete('gameId');
          }
          window.history.replaceState({}, '', url);
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
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const emit = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { connected, state, emit };
}
