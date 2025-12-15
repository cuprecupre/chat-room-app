import { useState, useEffect, useCallback } from 'react';
import { auth, ensurePersistence, signInWithCustomToken, onIdTokenChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../lib/firebase';
import { saveToken, clearToken } from '../lib/tokenStorage';

export function useAuth() {
  // Verificar si Firebase ya tiene un usuario en memoria (evita parpadeo en recargas)
  const hasCurrentUser = auth.currentUser !== null;

  const [user, setUser] = useState(auth.currentUser); // Inicializar con usuario actual si existe
  const [loading, setLoading] = useState(!hasCurrentUser); // Solo loading si no hay usuario
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let authResolved = false;
    let tokenRefreshInterval = null;

    const unsubscribe = onIdTokenChanged(auth, async (u) => {
      authResolved = true;
      if (isMounted) {
        setUser(u);
        setLoading(false);

        // Si hay usuario autenticado, guardar token en localStorage
        if (u) {
          try {
            const token = await u.getIdToken();
            saveToken(token);
            console.log('🔑 Token guardado después de auth state change');

            // Configurar refresh automático del token cada 50 minutos
            if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = setInterval(async () => {
              try {
                if (auth.currentUser) {
                  const freshToken = await auth.currentUser.getIdToken(true); // force refresh
                  saveToken(freshToken);
                  console.log('🔄 Token refrescado automáticamente');
                }
              } catch (error) {
                console.error('❌ Error refrescando token:', error);
              }
            }, 50 * 60 * 1000); // 50 minutos
          } catch (error) {
            console.error('❌ Error obteniendo token inicial:', error);
          }
        } else {
          // Si no hay usuario, limpiar token y detener refresh
          clearToken();
          if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
        }
      }
    });

    // Manejar custom token de Google Identity Services (viene de /auth/google)
    const handleGISToken = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('authToken');
        const errorParam = urlParams.get('error');

        // Limpiar URL de parámetros de auth
        if (authToken || errorParam) {
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (errorParam) {
          console.error('❌ Error de autenticación:', errorParam);
          if (isMounted) {
            setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
            setLoading(false);
          }
          return;
        }

        if (authToken) {
          console.log('🔐 Custom token recibido de GIS, iniciando sesión con Firebase...');
          setLoading(true);

          await ensurePersistence();
          const userCredential = await signInWithCustomToken(auth, authToken);

          console.log('✅ Sesión iniciada con custom token:', userCredential.user?.uid);
          authResolved = true;

          if (isMounted) {
            setUser(userCredential.user);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('❌ Error procesando custom token:', err);
        if (isMounted) {
          setError('Error al completar el inicio de sesión.');
          setLoading(false);
        }
      }
    };

    // Ejecutar inmediatamente
    handleGISToken();

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
      unsubscribe();
    };
  }, []);

  // Login con Google OAuth 2.0 (redirect directo a accounts.google.com)
  const GOOGLE_CLIENT_ID = '706542941882-483ctnm99nl51g174gj09srt1m7rmoqd.apps.googleusercontent.com';

  const login = useCallback(() => {
    console.log('� Redirigiendo a Google OAuth...');

    const redirectUri = `${window.location.origin}/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
    } catch (err) {
      console.error('Error login con email:', err?.code);
      let errorMessage = 'Error al iniciar sesión.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con ese email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Email o contraseña incorrectos.';
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const registerWithEmail = useCallback(async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📧 Registrando usuario con email...');
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Actualizar displayName ANTES de que onAuthStateChanged propague el usuario
      if (displayName) {
        console.log('📝 Actualizando displayName:', displayName);
        await updateProfile(result.user, { displayName });

        // Forzar recarga del usuario para obtener el displayName actualizado
        await result.user.reload();

        // IMPORTANTE: Forzar actualización del token para que incluya el displayName
        // El token JWT original no tiene el displayName, necesitamos uno nuevo
        await result.user.getIdToken(true); // true = force refresh

        // Esperar a que el currentUser tenga el displayName actualizado
        let retries = 0;
        if (!auth.currentUser?.displayName) {
          console.log('⏳ Esperando displayName...');
        }
        while (!auth.currentUser?.displayName && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          await auth.currentUser?.reload();
          retries++;
        }

        if (auth.currentUser?.displayName) {
          console.log('✅ DisplayName actualizado:', auth.currentUser?.displayName);
          // CRITICAL FIX: Force update user state directly so useSocket receives the displayName immediately
          // onIdTokenChanged might not fire fast enough or at all for profile updates
          setUser({ ...auth.currentUser });
        }
      }

      console.log('✅ Registro exitoso:', {
        email: result.user.email,
        displayName: auth.currentUser?.displayName,
        uid: result.user.uid
      });
      // setLoading se pondrá en false por onAuthStateChanged
    } catch (err) {
      console.error('❌ Error registro con email:', err);
      let errorMessage = 'Error al registrar usuario.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Ya existe una cuenta con ese email.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
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
      console.error('Logout Error:', err);
      setError(err.message || 'No se pudo cerrar la sesión.');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { user, loading, error, login, loginWithEmail, registerWithEmail, logout, clearError };
}
