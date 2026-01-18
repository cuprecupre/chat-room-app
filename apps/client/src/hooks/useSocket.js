import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";
import { auth } from "../lib/firebase";
import { getToken, saveToken, isTokenExpired } from "../lib/tokenStorage";
import { showToast } from "../lib/toast";

export function useSocket(user) {
    const { t } = useTranslation('common');
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState(null);
    const attemptedResumeRef = useRef(false);
    const initialLoadRef = useRef(true);
    const isInvitationPendingRef = useRef(false);
    const hasLoggedWaitingDisplayName = useRef(false);
    const [joinError, setJoinError] = useState(null);
    const [shutdownCountdown, setShutdownCountdown] = useState(null);

    // Helper to translate server messages
    const translateServerMessage = useCallback((message) => {
        if (!message) return "";

        // Exact matches
        const exactMap = {
            "La sala no existe.": "system.roomNotFound",
            "No perteneces a esta sala.": "system.notInRoom",
            "La partida no existe.": "system.gameNotFound",
            "El anfitrión ha abandonado la partida": "system.hostLeftMatch",
            "Tu sesión ha sido reemplazada por una nueva pestaña": "system.sessionReplaced",
            "El servidor está en mantenimiento. No se pueden crear nuevas partidas.": "system.serverMaintenance",
            "Has sido expulsado de la sala por el anfitrión": "system.kickedByHost",
        };

        if (exactMap[message]) {
            return t(exactMap[message]);
        }

        // Regex matches for dynamic messages
        const patterns = [
            { regex: /^(.+) ha vuelto a la sala$/, key: "system.userBackToRoom" },
            { regex: /^(.+) se unió a la sala$/, key: "system.userJoined" },
            { regex: /^(.+) abandonó\. Ahora el anfitrión es (.+)$/, key: "system.hostTransfer", multi: true },
            { regex: /^(.+) ha abandonado el juego$/, key: "system.userLeft" },
            { regex: /^(.+) ha sido expulsado de la sala$/, key: "system.userKicked" },
            { regex: /^(.+) se ha desconectado\. Ahora el anfitrión es (.+)$/, key: "system.disconnectedHostTransfer", multi: true },
            { regex: /^(.+) se ha desconectado$/, key: "system.userDisconnected" },
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern.regex);
            if (match) {
                if (pattern.multi) {
                    return t(pattern.key, { name: match[1], newHost: match[2] });
                }
                return t(pattern.key, { name: match[1] });
            }
        }

        // Fallback: return original message if no translation found
        return message;
    }, [t]);

    useEffect(() => {
        // No conectar socket si el usuario no tiene displayName
        // (puede pasar al registrarse con email mientras se actualiza el perfil)
        if (user && !user.displayName) {
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
                let token;
                try {
                    // Always get fresh token from auth.currentUser (guaranteed to have getIdToken method)
                    token = await auth.currentUser?.getIdToken();
                    if (token) {
                        saveToken(token);
                    } else {
                        throw new Error("No current user");
                    }
                } catch (e) {
                    console.warn("⚠️ Error obteniendo token de usuario, intentando fallback a storage:", e);
                    token = getToken();
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
                        transports: ["websocket", "polling"],
                        reconnection: true,
                        reconnectionAttempts: 10,
                        reconnectionDelay: 1000,
                        reconnectionDelayMax: 5000,
                    })
                    : io(socketURL, {
                        auth: { token, name: user.displayName, photoURL: user.photoURL },
                        transports: ["websocket", "polling"], // Prioritize WebSocket, fallback to polling
                        reconnection: true,
                        reconnectionAttempts: 10, // More attempts for flaky mobile
                        reconnectionDelay: 1000,
                        reconnectionDelayMax: 5000,
                    });
                socketRef.current = socket;

                socket.on("connect", () => {
                    if (isMounted) {
                        setConnected(true);
                        setJoinError(null); // Limpiar errores al conectar
                    }
                    attemptedResumeRef.current = false; // fresh session
                    const urlParams = new URLSearchParams(window.location.search);
                    const roomIdFromUrl = urlParams.get("roomId");

                    // Auto-join removed to allow InvitePage to handle new connections.
                    // Server handles automatic session resumption via handleReconnection.

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

                    // Proactive token refresh - refresh every 45 minutes to prevent expiration
                    const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
                    const tokenRefreshInterval = setInterval(async () => {
                        if (socket.connected && auth.currentUser) {
                            try {
                                const freshToken = await auth.currentUser.getIdToken(true);
                                saveToken(freshToken);
                                socket.auth.token = freshToken;
                                console.log("🔄 Token refrescado proactivamente");
                            } catch (error) {
                                console.error("❌ Error refrescando token proactivamente:", error);
                            }
                        } else {
                            clearInterval(tokenRefreshInterval);
                        }
                    }, TOKEN_REFRESH_INTERVAL);

                    // Store interval for cleanup
                    socket.tokenRefreshInterval = tokenRefreshInterval;
                });

                socket.on("disconnect", (reason) => {
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

                    if (
                        error.message?.includes("Authentication error") ||
                        error.message?.includes("Invalid token")
                    ) {
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
                            showToast(t('system.sessionExpired', "Tu sesión expiró. Por favor, vuelve a iniciar sesión."));
                        }
                    }
                });

                socket.on("game-state", (newState) => {
                    if (isMounted) setGameState(newState);
                    if (socket.resumeTimer) {
                        clearTimeout(socket.resumeTimer);
                        socket.resumeTimer = null;
                    }
                    const url = new URL(window.location);
                    if (newState?.roomId) {
                        const currentUrlId = url.searchParams.get("roomId");

                        if (
                            initialLoadRef.current &&
                            currentUrlId &&
                            currentUrlId !== newState.roomId
                        ) {
                            isInvitationPendingRef.current = true;
                        }

                        // Si ya nos unimos a la partida deseada, apagar la bandera
                        if (currentUrlId === newState.roomId) {
                            isInvitationPendingRef.current = false;
                        }

                        if (isInvitationPendingRef.current) {
                            // Si estamos intentando unirnos a una invitación, IGNORAR actualizaciones del servidor
                            // que nos devuelvan a la partida vieja.
                        } else {
                            // Comportamiento normal (Migración o Navegación dentro de partida)
                            if (currentUrlId !== newState.roomId) {
                                url.searchParams.set("roomId", newState.roomId);
                                window.history.replaceState({}, "", url.toString());
                            }
                        }

                        initialLoadRef.current = false;
                    } else {
                        const urlRoomId = url.searchParams.get("roomId");

                        if (initialLoadRef.current && urlRoomId) {
                            isInvitationPendingRef.current = true;
                        }

                        if (isInvitationPendingRef.current && urlRoomId) {
                            // NO borrar URL
                        } else if (urlRoomId) {
                            // Solo borrar si NO es una invitación pendiente
                            // Solo borrar si NO es una invitación pendiente
                            url.searchParams.delete("roomId");
                            window.history.replaceState({}, "", url.toString());
                        }

                        initialLoadRef.current = false;
                    }
                });

                // Optimized vote update - only updates voting-related fields
                // This reduces bandwidth by ~100x during voting phase
                socket.on("vote-update", (update) => {
                    if (isMounted) {
                        setGameState((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                votedPlayers: update.votedPlayers,
                                myVote: update.myVote,
                                hasVoted: update.hasVoted,
                                activePlayers: update.activePlayers,
                            };
                        });
                    }
                });

                // Optimized phase update - only updates phase-related fields
                socket.on("phase-update", (delta) => {
                    if (isMounted) {
                        setGameState((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                phase: delta.phase,
                                matchPhase: delta.matchPhase,
                                currentRound: delta.currentRound,
                                maxRounds: delta.maxRounds,
                            };
                        });
                    }
                });

                // Optimized player update - applies incremental change to player list
                socket.on("player-update", (delta) => {
                    if (isMounted) {
                        setGameState((prev) => {
                            if (!prev) return prev;

                            let players = [...prev.players];

                            if (delta.action === "joined") {
                                // Only add if not already present
                                if (!players.some(p => p.uid === delta.player.uid)) {
                                    players.push(delta.player);
                                }
                            } else if (delta.action === "left" || delta.action === "kicked") {
                                players = players.filter(p => p.uid !== delta.player.uid);
                            }

                            return {
                                ...prev,
                                players,
                                hostId: delta.hostId,
                            };
                        });
                    }
                });

                // Antes de cada intento de reconexión, actualizar el token
                socket.io.on("reconnect_attempt", async () => {
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
                    const roomIdFromUrl = urlParams.get("roomId");
                    // Only attempt rejoin if roomId is still in URL (meaning user didn't leave)
                    if (roomIdFromUrl && !attemptedResumeRef.current) {
                        attemptedResumeRef.current = true;
                        socket.emit("join-room", roomIdFromUrl);
                    }
                });

                socket.on("error-message", (message) => {
                    console.error("Server error:", message);

                    // Si el error es sobre unirse a partida, guardarlo en el estado
                    // NOTA: Usamos el mensaje original para la lógica de regex, 
                    // pero mostramos el traducido al usuario
                    if (/no existe|no perteneces|partida en curso/i.test(message)) {
                        if (isMounted) setJoinError(translateServerMessage(message));
                    } else {
                        // Solo mostrar toast para otros errores
                        showToast(translateServerMessage(message));
                    }

                    // MODIFICADO: NO borrar la URL si es "partida en curso" o "no existe"
                    // Queremos que App.jsx muestre una pantalla de error específica
                    // Solo limpiamos si es "no perteneces" (ej. intentando votar en partida ajena)
                    if (/no perteneces/i.test(message)) {
                        // ... lógica anterior de limpieza ...
                        const url = new URL(window.location);
                        url.searchParams.delete("roomId");
                        window.history.replaceState({}, "", url.toString());
                        if (isMounted) setGameState(null);
                    }
                });

                // Handle being kicked by host
                socket.on("kicked", (data) => {
                    console.log("[Socket] Kicked from room:", data?.message);
                    const msg = data?.message || "Has sido expulsado de la sala";
                    showToast(translateServerMessage(msg));
                    if (isMounted) {
                        setGameState(null);
                        const url = new URL(window.location);
                        url.searchParams.delete("roomId");
                        window.history.replaceState({}, "", url.toString());
                    }
                });

                socket.on("session-replaced", (message) => {
                    console.log("Session replaced:", message);
                    showToast(translateServerMessage(message));
                    // Clear game state and redirect to lobby
                    if (isMounted) {
                        setGameState(null);
                        setConnected(false);
                        const url = new URL(window.location);
                        url.searchParams.delete("roomId");
                        window.history.replaceState({}, "", url.toString());
                    }
                });

                // Escuchar toasts del servidor (ej: cambio de host)
                socket.on("toast", (message) => {
                    showToast(translateServerMessage(message));
                });

                // ============================================
                // Server Shutdown Events
                // ============================================

                socket.on("shutdown-countdown", (data) => {
                    if (isMounted) {
                        setShutdownCountdown({
                            remainingSeconds: data.remainingSeconds,
                            message: translateServerMessage(data.message),
                        });
                    }
                });

                socket.on("shutdown-complete", (data) => {
                    if (isMounted) {
                        setShutdownCountdown(null);
                        setGameState(null);
                        // Clear URL and show message
                        const url = new URL(window.location);
                        url.searchParams.delete("roomId");
                        window.history.replaceState({}, "", url.toString());
                        const msg = data.message || "El servidor se está reiniciando...";
                        showToast(translateServerMessage(msg));
                    }
                });

                socket.on("shutdown-cancelled", (data) => {
                    console.log("[Socket] Shutdown cancelled:", data);
                    if (isMounted) {
                        setShutdownCountdown(null);
                        const msg = data.message || "El mantenimiento ha sido cancelado";
                        showToast(translateServerMessage(msg));
                    }
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
                // Clear token refresh interval
                if (socketRef.current.tokenRefreshInterval) {
                    clearInterval(socketRef.current.tokenRefreshInterval);
                }
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user, user?.displayName, t, translateServerMessage]);

    const emit = useCallback((event, payload, callback) => {
        socketRef.current?.emit(event, payload, callback);
    }, []);

    return {
        connected,
        gameState,
        emit,
        joinError,
        clearJoinError: () => setJoinError(null),
        shutdownCountdown,
        socketRef,
    };
}
