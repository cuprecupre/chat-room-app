import { createContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
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
    signInAnonymously,
    updateProfile,
} from "../lib/firebase";
import { saveToken, clearToken } from "../lib/tokenStorage";

export const AuthContext = createContext(null);

// Serialize Firebase User to plain object (creates new reference for React state updates)
// Methods like getIdToken() should use auth.currentUser directly
function serializeUser(firebaseUser) {
    if (!firebaseUser) return null;
    return {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isAnonymous: firebaseUser.isAnonymous,
        emailVerified: firebaseUser.emailVerified,
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => serializeUser(auth.currentUser));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const redirectCheckRef = useRef(false);
    const prevUserUidRef = useRef(null);

    // Log only when user actually changes (inside useEffect)
    useEffect(() => {
        if (user?.uid !== prevUserUidRef.current) {
            console.log("🔍 [AuthContext] User changed:", {
                uid: user?.uid,
                displayName: user?.displayName,
                email: user?.email,
                isAnonymous: user?.isAnonymous,
            });
            prevUserUidRef.current = user?.uid;
        }
    }, [user?.uid, user?.displayName, user?.email, user?.isAnonymous]);

    // Log loading state changes
    useEffect(() => {
        console.log("🔄 [AuthContext] Loading state:", loading);
    }, [loading]);

    useEffect(() => {
        let isMounted = true;

        ensurePersistence();

        let authResolved = false;
        let tokenRefreshInterval = null;
        let redirectCheckInterval = null;

        const unsubscribe = onIdTokenChanged(auth, async (u) => {
            console.log("🔔 [onIdTokenChanged] Triggered:", {
                uid: u?.uid,
                displayName: u?.displayName,
            });
            authResolved = true;
            if (isMounted) {
                // Serialize to plain object to ensure React detects changes
                setUser(serializeUser(u));
                setLoading(false);

                if (u) {
                    try {
                        const token = await u.getIdToken();
                        saveToken(token);

                        const pendingRoomId = sessionStorage.getItem("pendingRoomId");
                        if (pendingRoomId) {
                            console.log("🔗 Restaurando roomId pendiente:", pendingRoomId);
                            sessionStorage.removeItem("pendingRoomId");
                            const url = new URL(window.location);
                            if (!url.searchParams.has("roomId")) {
                                url.searchParams.set("roomId", pendingRoomId);
                                window.history.replaceState({}, "", url.toString());
                            }
                        }

                        if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
                        tokenRefreshInterval = setInterval(
                            async () => {
                                try {
                                    if (auth.currentUser) {
                                        const freshToken = await auth.currentUser.getIdToken(true);
                                        saveToken(freshToken);
                                    }
                                } catch (err) {
                                    console.error("❌ Error refrescando token:", err);
                                }
                            },
                            50 * 60 * 1000
                        );
                    } catch (err) {
                        console.error("❌ Error obteniendo token inicial:", err);
                    }
                } else {
                    clearToken();
                    if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
                }
            }
        });

        const handleRedirect = async () => {
            if (redirectCheckRef.current) return;
            redirectCheckRef.current = true;

            try {
                const result = await getRedirectResult(auth);

                if (result) {
                    console.log("✅ Redirect exitoso:", result.user?.displayName);
                    authResolved = true;
                    if (isMounted) {
                        setUser(serializeUser(result.user));
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error("❌ Error en redirect:", err?.message);
                if (isMounted) {
                    setError(err?.message || "Error al procesar autenticación");
                    setLoading(false);
                }
            }
            try {
                sessionStorage.removeItem("auth:redirect");
            } catch (_) {}
        };

        handleRedirect();

        redirectCheckInterval = setInterval(async () => {
            if (!authResolved && isMounted) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        console.log("✅ Redirect detectado en verificación periódica");
                        authResolved = true;
                        setUser(serializeUser(result.user));
                        setLoading(false);
                        clearInterval(redirectCheckInterval);
                    }
                } catch (_) {}
            }
        }, 1000);

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && !authResolved && isMounted) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        console.log("✅ Redirect detectado al volver a la página");
                        authResolved = true;
                        setUser(serializeUser(result.user));
                        setLoading(false);
                    }
                } catch (_) {}
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

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
            const usePopup = import.meta.env.DEV || import.meta.env.VITE_AUTH_USE_POPUP === "true";

            if (usePopup) {
                console.log("🚀 Iniciando login con POPUP...");
                await signInWithPopup(auth, provider);
            } else {
                console.log("🚀 Iniciando login con REDIRECT...");
                sessionStorage.setItem("auth:redirect", "1");

                const urlRoomId = new URLSearchParams(window.location.search).get("roomId");
                if (urlRoomId) {
                    sessionStorage.setItem("pendingRoomId", urlRoomId);
                }

                await signInWithRedirect(auth, provider);
            }
        } catch (err) {
            console.error("❌ Error en login:", err?.code || err?.message);

            let errorMessage = "No se pudo iniciar sesión.";
            if (err?.message === "TIMEOUT") {
                errorMessage = "El login tardó demasiado. Verifica tu conexión.";
            } else if (err?.code === "auth/unauthorized-domain") {
                errorMessage = "Este dominio no está autorizado en Firebase.";
            } else if (err?.code === "auth/operation-not-allowed") {
                errorMessage = "El proveedor de Google no está habilitado.";
            } else if (err?.code === "auth/network-request-failed") {
                errorMessage = "Error de red. Verifica tu conexión.";
            } else if (err?.code === "auth/cancelled-popup-request") {
                errorMessage = "Se canceló la solicitud de autenticación.";
            } else if (err?.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setLoading(false);

            try {
                sessionStorage.removeItem("auth:redirect");
            } catch (_) {}
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

            if (displayName) {
                console.log("📝 Actualizando displayName:", displayName);
                await updateProfile(result.user, { displayName });
                await result.user.reload();
                await result.user.getIdToken(true);

                let retries = 0;
                while (!auth.currentUser?.displayName && retries < 10) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    await auth.currentUser?.reload();
                    retries++;
                }

                // Serialize to ensure React detects the change
                if (auth.currentUser) {
                    console.log("✅ DisplayName actualizado:", auth.currentUser.displayName);
                    setUser(serializeUser(auth.currentUser));
                }
            }

            console.log("✅ Registro exitoso:", {
                email: result.user.email,
                displayName: auth.currentUser?.displayName,
            });
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
            clearToken();
            await signOut(auth);
        } catch (err) {
            console.error("Logout Error:", err);
            setError(err.message || "No se pudo cerrar la sesión.");
        }
    }, []);

    const loginAsGuest = useCallback(async (guestName) => {
        setLoading(true);
        setError(null);
        try {
            console.log("👤 Iniciando sesión anónima como:", guestName);
            const result = await signInAnonymously(auth);

            if (guestName) {
                await updateProfile(result.user, { displayName: guestName });
                await result.user.reload();
                await result.user.getIdToken(true);

                let retries = 0;
                while (!auth.currentUser?.displayName && retries < 10) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    await auth.currentUser?.reload();
                    retries++;
                }

                // Serialize to ensure React detects the change
                if (auth.currentUser) {
                    console.log("✅ DisplayName actualizado:", auth.currentUser.displayName);
                    setUser(serializeUser(auth.currentUser));
                }
            }

            console.log("✅ Sesión anónima exitosa:", {
                uid: result.user.uid,
                displayName: auth.currentUser?.displayName,
                isAnonymous: result.user.isAnonymous,
            });
        } catch (err) {
            console.error("❌ Error en login anónimo:", err);
            let errorMessage = "Error al iniciar sesión como invitado.";
            if (err.code === "auth/operation-not-allowed") {
                errorMessage = "El modo invitado no está habilitado.";
            } else if (err.code === "auth/network-request-failed") {
                errorMessage = "Error de red. Verifica tu conexión.";
            }
            setError(errorMessage);
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            error,
            login,
            loginWithEmail,
            registerWithEmail,
            loginAsGuest,
            logout,
            clearError,
        }),
        [user, loading, error, login, loginWithEmail, registerWithEmail, loginAsGuest, logout, clearError]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
