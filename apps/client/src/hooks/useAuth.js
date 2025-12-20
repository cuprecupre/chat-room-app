import { useState, useEffect, useCallback, useRef } from "react";
import {
    auth,
    provider,
    ensurePersistence,
    signInWithRedirect,
    signInWithPopup,
    getRedirectResult,
    onIdTokenChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
} from "../lib/firebase";
import { saveToken, clearToken } from "../lib/tokenStorage";

export function useAuth() {
    // Verificar si Firebase ya tiene un usuario en memoria (evita parpadeo en recargas)
    const hasCurrentUser = auth.currentUser !== null;
    const hasRedirect =
        typeof window !== "undefined" && sessionStorage.getItem("auth:redirect") === "1";

    console.log("🔍 [useAuth] Initialization:", {
        hasCurrentUser,
        hasRedirect,
        currentUserUid: auth.currentUser?.uid,
        sessionStorageFlag: sessionStorage.getItem("auth:redirect"),
    });

    const [user, setUser] = useState(auth.currentUser); // Inicializar con usuario actual si existe
    const [loading, setLoading] = useState(hasRedirect && !hasCurrentUser); // Solo loading si hay redirect Y no hay usuario
    const [error, setError] = useState(null);
    const redirectCheckRef = useRef(false);

    useEffect(() => {
        console.log("🔄 [useAuth] useEffect mounted");
        let isMounted = true;
        let authResolved = false;
        let tokenRefreshInterval = null;
        let redirectCheckInterval = null;

        const unsubscribe = onIdTokenChanged(auth, async (u) => {
            console.log("🔔 [onIdTokenChanged] Triggered:", {
                uid: u?.uid,
                displayName: u?.displayName,
                email: u?.email,
                authResolved,
            });
            authResolved = true;
            if (isMounted) {
                setUser(u);
                setLoading(false);

                // Si hay usuario autenticado, guardar token en localStorage
                if (u) {
                    try {
                        const token = await u.getIdToken();
                        saveToken(token);
                        console.log("🔑 Token guardado después de auth state change");

                        // Restore pending gameId from sessionStorage after OAuth login
                        const pendingGameId = sessionStorage.getItem("pendingGameId");
                        if (pendingGameId) {
                            console.log("🔗 Restaurando gameId pendiente:", pendingGameId);
                            sessionStorage.removeItem("pendingGameId");
                            const url = new URL(window.location);
                            if (!url.searchParams.has("gameId")) {
                                url.searchParams.set("gameId", pendingGameId);
                                window.history.replaceState({}, "", url.toString());
                            }
                        }

                        // Configurar refresh automático del token cada 50 minutos
                        if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
                        tokenRefreshInterval = setInterval(
                            async () => {
                                try {
                                    if (auth.currentUser) {
                                        const freshToken = await auth.currentUser.getIdToken(true); // force refresh
                                        saveToken(freshToken);
                                        console.log("🔄 Token refrescado automáticamente");
                                    }
                                } catch (error) {
                                    console.error("❌ Error refrescando token:", error);
                                }
                            },
                            50 * 60 * 1000
                        ); // 50 minutos
                    } catch (error) {
                        console.error("❌ Error obteniendo token inicial:", error);
                    }
                } else {
                    console.log("🚪 No hay usuario, limpiando token");
                    // Si no hay usuario, limpiar token y detener refresh
                    clearToken();
                    if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
                }
            }
        });

        // Manejar posible flujo de redirect en navegadores móviles
        const handleRedirect = async () => {
            if (redirectCheckRef.current) {
                console.log("🚫 [handleRedirect] Skipping - already checked in this session");
                return;
            }
            redirectCheckRef.current = true;

            try {
                console.log("🔄 [handleRedirect] Iniciando verificación de redirect...");
                console.log("🔍 [handleRedirect] Estado antes de getRedirectResult:", {
                    hasRedirectFlag: sessionStorage.getItem("auth:redirect"),
                    currentUser: auth.currentUser?.uid,
                    authResolved,
                });

                const result = await getRedirectResult(auth);

                console.log("📥 [handleRedirect] getRedirectResult response:", {
                    hasResult: !!result,
                    user: result?.user?.uid,
                    displayName: result?.user?.displayName,
                    email: result?.user?.email,
                    providerId: result?.providerId,
                });

                if (result) {
                    console.log("✅ Redirect exitoso:", result.user?.displayName);
                    authResolved = true;
                    if (isMounted) {
                        setUser(result.user);
                        setLoading(false);
                    }
                } else {
                    console.log("ℹ️ No hay resultado de redirect (getRedirectResult returned null)");
                }
            } catch (err) {
                console.error("❌ Error en redirect:", {
                    message: err?.message,
                    code: err?.code,
                    stack: err?.stack,
                });
                if (isMounted) {
                    setError(err?.message || "Error al procesar autenticación");
                    setLoading(false);
                }
            }
            try {
                console.log("🧹 Limpiando sessionStorage flag");
                sessionStorage.removeItem("auth:redirect");
            } catch (_) { }
        };

        // Ejecutar inmediatamente
        console.log("⏱️ Ejecutando handleRedirect inmediatamente...");
        handleRedirect();

        // También verificar periódicamente en caso de que el redirect tarde
        console.log("⏰ Configurando verificación periódica cada 1 segundo...");
        redirectCheckInterval = setInterval(async () => {
            if (!authResolved && isMounted) {
                console.log("🔁 [Periodic Check] Verificando redirect...", { authResolved });
                try {
                    const result = await getRedirectResult(auth);
                    console.log("📥 [Periodic Check] Result:", {
                        hasResult: !!result,
                        user: result?.user?.uid,
                    });
                    if (result) {
                        console.log(
                            "✅ Redirect detectado en verificación periódica:",
                            result.user?.displayName
                        );
                        authResolved = true;
                        setUser(result.user);
                        setLoading(false);
                        clearInterval(redirectCheckInterval);
                    }
                } catch (err) {
                    console.log("ℹ️ Verificación periódica de redirect:", err?.message);
                }
            }
        }, 1000); // Verificar cada segundo

        // Listener para cuando la página se vuelve visible (regresa del redirect)
        const handleVisibilityChange = async () => {
            console.log("👁️ [visibilitychange] Event:", {
                visibilityState: document.visibilityState,
                authResolved,
                isMounted,
            });
            if (document.visibilityState === "visible" && !authResolved && isMounted) {
                console.log("👁️ Página visible, verificando redirect...");
                try {
                    const result = await getRedirectResult(auth);
                    console.log("📥 [visibilitychange] Result:", {
                        hasResult: !!result,
                        user: result?.user?.uid,
                    });
                    if (result) {
                        console.log(
                            "✅ Redirect detectado al volver a la página:",
                            result.user?.displayName
                        );
                        authResolved = true;
                        setUser(result.user);
                        setLoading(false);
                    }
                } catch (err) {
                    console.log("ℹ️ Verificación al volver a la página:", err?.message);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Timeout de seguridad solo si la autenticación no se resuelve
        const timeout = setTimeout(() => {
            if (!authResolved && isMounted) {
                setLoading(false);
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
            if (redirectCheckInterval) clearInterval(redirectCheckInterval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            unsubscribe();
        };
    }, []);

    const login = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            console.log("🔄 Iniciando proceso de login...");

            // Use Popup in Development (or if explicitly enabled via ENV) to avoid Redirect issues
            const usePopup = import.meta.env.DEV || import.meta.env.VITE_AUTH_USE_POPUP === "true";

            if (usePopup) {
                console.log("🚀 Iniciando login con POPUP (Development/Hybrid Mode)...");
                const result = await signInWithPopup(auth, provider);
                console.log("✅ Popup login exitoso:", result.user?.displayName);
                // State updates handled by onIdTokenChanged
            } else {
                console.log("🚀 Iniciando login con REDIRECT (Production Mode)...");

                // Marcar que estamos iniciando un redirect
                sessionStorage.setItem("auth:redirect", "1");

                // Save pending gameId before OAuth redirect
                const urlGameId = new URLSearchParams(window.location.search).get("gameId");
                if (urlGameId) {
                    console.log("🔗 Guardando gameId pendiente:", urlGameId);
                    sessionStorage.setItem("pendingGameId", urlGameId);
                }

                // Redirigir a Google para autenticación
                await signInWithRedirect(auth, provider);
                console.log("🌐 Redirigiendo a Google...");
            }
        } catch (err) {
            console.error("❌ Error en login:", err?.code || err?.message);

            let errorMessage = "No se pudo iniciar sesión.";

            if (err?.message === "TIMEOUT") {
                errorMessage =
                    "El login tardó demasiado. Verifica tu conexión y que el dominio esté autorizado en Firebase.";
            } else if (err?.code === "auth/unauthorized-domain") {
                errorMessage =
                    "Este dominio no está autorizado en Firebase. Verifica la configuración.";
            } else if (err?.code === "auth/operation-not-allowed") {
                errorMessage = "El proveedor de Google no está habilitado en Firebase.";
            } else if (err?.code === "auth/network-request-failed") {
                errorMessage = "Error de red. Verifica tu conexión a internet.";
            } else if (err?.code === "auth/cancelled-popup-request") {
                errorMessage = "Se canceló la solicitud de autenticación.";
            } else if (err?.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setLoading(false);

            // Limpiar flag de redirect si falla
            try {
                sessionStorage.removeItem("auth:redirect");
            } catch (_) { }
        }
    }, []);

    const loginWithEmail = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setLoading(false);
        } catch (err) {
            console.error("Error login con email:", err?.code);
            let errorMessage = "Error al iniciar sesión.";
            if (err.code === "auth/user-not-found") {
                errorMessage = "No existe una cuenta con ese email.";
            } else if (err.code === "auth/wrong-password") {
                errorMessage = "Contraseña incorrecta.";
            } else if (err.code === "auth/invalid-email") {
                errorMessage = "Email inválido.";
            } else if (err.code === "auth/invalid-credential") {
                errorMessage = "Email o contraseña incorrectos.";
            }
            setError(errorMessage);
            setLoading(false);
        }
    }, []);

    const registerWithEmail = useCallback(async (email, password, displayName) => {
        setLoading(true);
        setError(null);
        try {
            console.log("📧 Registrando usuario con email...");
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Actualizar displayName ANTES de que onAuthStateChanged propague el usuario
            if (displayName) {
                console.log("📝 Actualizando displayName:", displayName);
                await updateProfile(result.user, { displayName });

                // Forzar recarga del usuario para obtener el displayName actualizado
                await result.user.reload();

                // IMPORTANTE: Forzar actualización del token para que incluya el displayName
                // El token JWT original no tiene el displayName, necesitamos uno nuevo
                await result.user.getIdToken(true); // true = force refresh

                // Esperar a que el currentUser tenga el displayName actualizado
                let retries = 0;
                if (!auth.currentUser?.displayName) {
                    console.log("⏳ Esperando displayName...");
                }
                while (!auth.currentUser?.displayName && retries < 10) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    await auth.currentUser?.reload();
                    retries++;
                }

                if (auth.currentUser?.displayName) {
                    console.log("✅ DisplayName actualizado:", auth.currentUser?.displayName);
                    // CRITICAL FIX: Force update user state directly so useSocket receives the displayName immediately
                    // onIdTokenChanged might not fire fast enough or at all for profile updates
                    setUser({ ...auth.currentUser });
                }
            }

            console.log("✅ Registro exitoso:", {
                email: result.user.email,
                displayName: auth.currentUser?.displayName,
                uid: result.user.uid,
            });
            // setLoading se pondrá en false por onAuthStateChanged
        } catch (err) {
            console.error("❌ Error registro con email:", err);
            let errorMessage = "Error al registrar usuario.";
            if (err.code === "auth/email-already-in-use") {
                errorMessage = "Ya existe una cuenta con ese email.";
            } else if (err.code === "auth/weak-password") {
                errorMessage = "La contraseña debe tener al menos 6 caracteres.";
            } else if (err.code === "auth/invalid-email") {
                errorMessage = "Email inválido.";
            }
            setError(errorMessage);
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            clearToken(); // Limpiar token de localStorage primero
            await signOut(auth);
        } catch (err) {
            console.error("Logout Error:", err);
            setError(err.message || "No se pudo cerrar la sesión.");
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return { user, loading, error, login, loginWithEmail, registerWithEmail, logout, clearError };
}
