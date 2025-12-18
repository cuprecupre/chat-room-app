import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getToken, saveToken, isTokenExpired } from "../lib/tokenStorage";
import { showToast } from "../lib/toast";

export function useSocket(user) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState(null);
    const attemptedResumeRef = useRef(false);
    const hasLoggedWaitingDisplayName = useRef(false);
    const [joinError, setJoinError] = useState(null); // Nuevo estado para errores de unión

    useEffect(() => {
        // No conectar socket si el usuario no tiene displayName
        // (puede pasar al registrarse con email mientras se actualiza el perfil)
        if (user && !user.displayName) {
            if (!hasLoggedWaitingDisplayName.current) {
                console.log("⏳ useSocket - Esperando displayName...");
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
                // Intentar obtener token de localStorage primero (solución para iOS)
                let token = getToken();

                // Si no hay token en localStorage o está expirado, obtener de Firebase
                if (!token || isTokenExpired()) {
                    console.log("🔑 Obteniendo token desde Firebase Auth...");
                    token = await user.getIdToken(true); // force refresh
                    saveToken(token); // Guardar para próximas conexiones
                    console.log("✅ Token obtenido y guardado desde Firebase");
                } else {
                    console.log("✅ Usando token de localStorage");
                }

                if (!isMounted) return;

                // En desarrollo (y no staging), usar puerto 3000
                const isProductionOrStaging =
                    import.meta.env.MODE === "production" || import.meta.env.MODE === "staging";
                const socketURL = isProductionOrStaging
                    ? window.location.origin
                    : `${window.location.protocol}//${window.location.hostname}:3000`;

                const socket = window.MockSocketIO
                    ? new window.MockSocketIO(socketURL, {
                          auth: { token, name: user.displayName, photoURL: user.photoURL },
                          reconnection: true,
                          reconnectionAttempts: 5,
                      })
                    : io(socketURL, {
                          auth: { token, name: user.displayName, photoURL: user.photoURL },
                          reconnection: true,
                          reconnectionAttempts: 5,
                      });
                socketRef.current = socket;

                socket.on("connect", () => {
                    console.log("✅ Socket conectado:", user.displayName);
                    if (isMounted) {
                        setConnected(true);
                        setJoinError(null); // Limpiar errores al conectar
                    }
                    attemptedResumeRef.current = false; // fresh session
                    const urlParams = new URLSearchParams(window.location.search);
                    const gameIdFromUrl = urlParams.get("gameId");
                    // if (gameIdFromUrl && !attemptedResumeRef.current) {
                    //   attemptedResumeRef.current = true;
                    //   // Intento de reanudar sesión
                    //   socket.emit('join-game', gameIdFromUrl);
                    //   // Si en 2s no llega estado, forzar UI de recuperación
                    //   if (socket.resumeTimer) clearTimeout(socket.resumeTimer);
                    //   socket.resumeTimer = setTimeout(() => {
                    //     if (!socketRef.current) return;
                    //     console.log('[Socket] Resume timeout, mostrando UI de unión');
                    //     // No borrar el gameId de la URL: App mostrará la UI de unión/limpieza
                    //     if (isMounted) setGameState(null);
                    //   }, 2000);
                    // }

                    // Start heartbeat to keep connection alive
                    const heartbeatInterval = setInterval(() => {
                        if (socket.connected) {
                            socket.emit("heartbeat");
                        } else {
                            clearInterval(heartbeatInterval);
                        }
                    }, 30000); // Send heartbeat every 30 seconds

                    // Store interval for cleanup
                    socket.heartbeatInterval = heartbeatInterval;
                });

                socket.on("disconnect", (reason) => {
                    console.log("🔌 useSocket - Socket desconectado. Razón:", reason);
                    if (isMounted) {
                        setConnected(false);
                        // Don't clear gameState on disconnect - keep it for reconnection
                        attemptedResumeRef.current = false;
                    }
                });

                socket.on("connect_error", async (error) => {
                    console.error("❌ useSocket - Error de conexión del socket:", {
                        message: error.message,
                        type: error.type,
                        description: error.description,
                        context: error.context,
                    });

                    // Si es error de autenticación, intentar refrescar token
                    if (
                        error.message?.includes("Authentication error") ||
                        error.message?.includes("Invalid token")
                    ) {
                        console.log("🔄 Error de autenticación, intentando refrescar token...");
                        try {
                            if (user) {
                                const freshToken = await user.getIdToken(true); // force refresh
                                saveToken(freshToken);
                                console.log(
                                    "✅ Token refrescado, socket se reconectará automáticamente"
                                );
                            }
                        } catch (refreshError) {
                            console.error("❌ No se pudo refrescar el token:", refreshError);
                            // Mostrar mensaje al usuario
                            showToast("Tu sesión expiró. Por favor, vuelve a iniciar sesión.");
                        }
                    }
                });

                socket.on("game-state", (newState) => {
                    console.log(
                        "[Socket] Received game-state:",
                        newState
                            ? { phase: newState.phase, role: newState.role }
                            : "null (user left or game ended)"
                    );
                    if (isMounted) setGameState(newState);
                    if (socket.resumeTimer) {
                        clearTimeout(socket.resumeTimer);
                        socket.resumeTimer = null;
                    }
                    const url = new URL(window.location);
                    if (newState?.gameId) {
                        const currentUrlId = url.searchParams.get("gameId");
                        // Only update URL if empty or matching (don't overwrite if user is trying to join another game via URL)
                        // App.jsx will handle the mismatch UI
                        if (!currentUrlId || currentUrlId === newState.gameId) {
                            url.searchParams.set("gameId", newState.gameId);
                            window.history.replaceState({}, "", url.toString());
                        }
                    } else {
                        // IMPORTANT: When receiving null state, ALWAYS clear the URL gameId
                        // This happens when:
                        // 1. User explicitly leaves the game
                        // 2. User was removed from the game
                        // 3. Game was deleted/ended
                        // Clearing URL prevents the user from getting stuck trying to rejoin
                        const urlGameId = url.searchParams.get("gameId");
                        if (urlGameId) {
                            console.log(
                                "[Socket] Clearing gameId from URL after receiving null state"
                            );
                            url.searchParams.delete("gameId");
                            window.history.replaceState({}, "", url.toString());
                        }
                    }
                });

                // Antes de cada intento de reconexión, actualizar el token
                socket.io.on("reconnect_attempt", async () => {
                    console.log("🔄 Intentando reconexión, actualizando token...");
                    try {
                        // Intentar obtener token fresco
                        let freshToken = getToken();

                        // Si el token en localStorage está expirado o no existe, obtener de Firebase
                        if (!freshToken || isTokenExpired(10)) {
                            // 10 minutos de buffer
                            if (user) {
                                freshToken = await user.getIdToken(true);
                                saveToken(freshToken);
                                console.log("✅ Token refrescado desde Firebase para reconexión");
                            }
                        }

                        // Actualizar auth del socket con el token fresco
                        if (freshToken) {
                            socket.auth.token = freshToken;
                            console.log("✅ Token actualizado en socket.auth");
                        }
                    } catch (error) {
                        console.error("❌ Error actualizando token para reconexión:", error);
                    }
                });

                socket.on("reconnect", () => {
                    console.log("Socket reconnected, attempting to resume...");
                    const urlParams = new URLSearchParams(window.location.search);
                    const gameIdFromUrl = urlParams.get("gameId");
                    // Only attempt rejoin if gameId is still in URL (meaning user didn't leave)
                    if (gameIdFromUrl && !attemptedResumeRef.current) {
                        attemptedResumeRef.current = true;
                        socket.emit("join-game", gameIdFromUrl);
                    }
                });

                socket.on("error-message", (message) => {
                    console.error("Server error:", message);

                    // Si el error es sobre unirse a partida, guardarlo en el estado
                    if (/no existe|no perteneces|partida en curso/i.test(message)) {
                        if (isMounted) setJoinError(message);
                    } else {
                        // Solo mostrar toast para otros errores
                        showToast(message);
                    }

                    // MODIFICADO: NO borrar la URL si es "partida en curso" o "no existe"
                    // Queremos que App.jsx muestre una pantalla de error específica
                    // Solo limpiamos si es "no perteneces" (ej. intentando votar en partida ajena)
                    if (/no perteneces/i.test(message)) {
                        // ... lógica anterior de limpieza ...
                        const url = new URL(window.location);
                        url.searchParams.delete("gameId");
                        window.history.replaceState({}, "", url.toString());
                        if (isMounted) setGameState(null);
                    }
                });

                socket.on("session-replaced", (message) => {
                    console.log("Session replaced:", message);
                    showToast(message);
                    // Clear game state and redirect to lobby
                    if (isMounted) {
                        setGameState(null);
                        setConnected(false);
                        const url = new URL(window.location);
                        url.searchParams.delete("gameId");
                        window.history.replaceState({}, "", url.toString());
                    }
                });

                // Escuchar toasts del servidor (ej: cambio de host)
                socket.on("toast", (message) => {
                    console.log("[Socket] Toast from server:", message);
                    showToast(message);
                });
            } catch (error) {
                console.error("❌ useSocket - Error al obtener token de Firebase para socket:", {
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
                console.log("Cleaning up socket connection...");
                // Clear heartbeat interval
                if (socketRef.current.heartbeatInterval) {
                    clearInterval(socketRef.current.heartbeatInterval);
                }
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user, user?.displayName]);

    const emit = useCallback((event, payload, callback) => {
        socketRef.current?.emit(event, payload, callback);
    }, []);

    return { connected, gameState, emit, joinError, clearJoinError: () => setJoinError(null) };
}
