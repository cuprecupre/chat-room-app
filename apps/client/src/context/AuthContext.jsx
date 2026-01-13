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
    sendPasswordResetEmail,
    getAdditionalUserInfo,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "../lib/firebase";
import { saveToken, clearToken } from "../lib/tokenStorage";

export const AuthContext = createContext(null);

// Serialize Firebase User to plain object (creates new reference for React state updates)
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
    const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
    const redirectCheckRef = useRef(false);
    const prevUserUidRef = useRef(null);

    useEffect(() => {
        if (user?.uid !== prevUserUidRef.current) {
            prevUserUidRef.current = user?.uid;
        }
    }, [user?.uid]);

    useEffect(() => {
        let isMounted = true;
        ensurePersistence();

        let authResolved = false;
        let tokenRefreshInterval = null;
        let redirectCheckInterval = null;

        const unsubscribe = onIdTokenChanged(auth, async (u) => {
            authResolved = true;
            if (isMounted) {
                setUser(serializeUser(u));
                setLoading(false);

                if (u) {
                    try {
                        const token = await u.getIdToken();
                        saveToken(token);

                        const pendingRoomId = sessionStorage.getItem("pendingRoomId");
                        if (pendingRoomId) {
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
                    const additionalInfo = getAdditionalUserInfo(result);
                    if (additionalInfo?.isNewUser) {
                        setNeedsProfileSetup(true);
                    }
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
            } catch (_) { }
        };

        handleRedirect();

        redirectCheckInterval = setInterval(async () => {
            if (!authResolved && isMounted) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        authResolved = true;
                        setUser(serializeUser(result.user));
                        setLoading(false);
                        clearInterval(redirectCheckInterval);
                    }
                } catch (_) { }
            }
        }, 1000);

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && !authResolved && isMounted) {
                try {
                    const result = await getRedirectResult(auth);
                    if (result) {
                        authResolved = true;
                        setUser(serializeUser(result.user));
                        setLoading(false);
                    }
                } catch (_) { }
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

    const uploadUserPhoto = useCallback(async (file, userId) => {
        if (!file || !userId) return null;
        try {
            const fileExtension = file.name.split('.').pop();
            const storageRef = ref(storage, `users/${userId}/profile_${Date.now()}.${fileExtension}`);
            const result = await uploadBytes(storageRef, file);
            return await getDownloadURL(result.ref);
        } catch (err) {
            return null;
        }
    }, []);

    const login = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const usePopup = import.meta.env.DEV || import.meta.env.VITE_AUTH_USE_POPUP === "true";
            if (usePopup) {
                const result = await signInWithPopup(auth, provider);
                const additionalInfo = getAdditionalUserInfo(result);
                if (additionalInfo?.isNewUser) {
                    setNeedsProfileSetup(true);
                }
            } else {
                sessionStorage.setItem("auth:redirect", "1");
                const urlRoomId = new URLSearchParams(window.location.search).get("roomId");
                if (urlRoomId) {
                    sessionStorage.setItem("pendingRoomId", urlRoomId);
                }
                await signInWithRedirect(auth, provider);
            }
        } catch (err) {
            let errorMessage = "No se pudo iniciar sesión.";
            if (err?.code === "auth/network-request-failed") {
                errorMessage = "Error de red. Verifica tu conexión.";
            } else if (err?.code === "auth/cancelled-popup-request") {
                errorMessage = "Se canceló la solicitud de autenticación.";
            }
            setError(errorMessage);
            setLoading(false);
        }
    }, []);

    const loginWithEmail = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setLoading(false);
        } catch (err) {
            let errorMessage = "Error al iniciar sesión.";
            if (err.code === "auth/user-not-found") {
                errorMessage = "No existe una cuenta con ese email.";
            } else if (err.code === "auth/wrong-password") {
                errorMessage = "Contraseña incorrecta.";
            } else if (err.code === "auth/invalid-credential") {
                errorMessage = "Email o contraseña incorrectos.";
            }
            setError(errorMessage);
            setLoading(false);
        }
    }, []);

    const registerWithEmail = useCallback(async (email, password, displayName, photoData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            let finalPhotoURL = null;
            if (photoData instanceof File) {
                finalPhotoURL = await uploadUserPhoto(photoData, result.user.uid);
            } else if (typeof photoData === 'string') {
                finalPhotoURL = photoData;
            }

            const profileUpdates = {};
            if (displayName) profileUpdates.displayName = displayName;
            if (finalPhotoURL) profileUpdates.photoURL = finalPhotoURL;

            if (Object.keys(profileUpdates).length > 0) {
                await updateProfile(result.user, profileUpdates);
                await result.user.reload();
                await result.user.getIdToken(true);

                let retries = 0;
                while (!auth.currentUser?.displayName && retries < 10) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    await auth.currentUser?.reload();
                    retries++;
                }

                if (auth.currentUser) {
                    setUser(serializeUser(auth.currentUser));
                }
            }
        } catch (err) {
            let errorMessage = "Error al registrar usuario.";
            if (err.code === "auth/email-already-in-use") {
                errorMessage = "Ya existe una cuenta con ese email.";
            } else if (err.code === "auth/weak-password") {
                errorMessage = "La contraseña debe tener al menos 6 caracteres.";
            }
            setError(errorMessage);
            setLoading(false);
        }
    }, [uploadUserPhoto]);

    const logout = useCallback(async () => {
        try {
            clearToken();
            await signOut(auth);
        } catch (err) {
            setError(err.message || "No se pudo cerrar la sesión.");
        }
    }, []);

    const loginAsGuest = useCallback(async (guestName) => {
        setLoading(true);
        setError(null);
        try {
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

                if (auth.currentUser) {
                    setUser(serializeUser(auth.currentUser));
                }
            }
        } catch (err) {
            setError("Error al iniciar sesión como invitado.");
            setLoading(false);
        }
    }, []);

    const updateUserInfo = useCallback(async (displayName, photoData) => {
        if (!auth.currentUser) return false;
        setLoading(true);
        setError(null);
        try {
            let finalPhotoURL = null;
            if (photoData instanceof File) {
                finalPhotoURL = await uploadUserPhoto(photoData, auth.currentUser.uid);
            } else if (typeof photoData === 'string') {
                finalPhotoURL = photoData;
            }

            await updateProfile(auth.currentUser, {
                displayName: displayName !== undefined ? displayName : auth.currentUser.displayName,
                photoURL: finalPhotoURL !== null ? finalPhotoURL : auth.currentUser.photoURL,
            });
            setUser(serializeUser(auth.currentUser));
            setLoading(false);
            return true;
        } catch (err) {
            setError("Error al actualizar el perfil.");
            setLoading(false);
            return false;
        }
    }, [uploadUserPhoto]);

    const recoverPassword = useCallback(async (email) => {
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setLoading(false);
            return true;
        } catch (err) {
            setError("Error al enviar el correo de recuperación.");
            setLoading(false);
            return false;
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
            updateUserInfo,
            recoverPassword,
            uploadUserPhoto,
            needsProfileSetup,
            setNeedsProfileSetup,
            clearError,
        }),
        [user, loading, error, login, loginWithEmail, registerWithEmail, loginAsGuest, logout, updateUserInfo, recoverPassword, uploadUserPhoto, needsProfileSetup, clearError]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
