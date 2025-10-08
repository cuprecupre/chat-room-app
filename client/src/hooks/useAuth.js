import { useState, useEffect, useCallback } from 'react';
import { auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from '../lib/firebase';
import { saveToken, clearToken } from '../lib/tokenStorage';

export function useAuth() {
  // Verificar si Firebase ya tiene un usuario en memoria (evita parpadeo en recargas)
  const hasCurrentUser = auth.currentUser !== null;
  const hasRedirect = typeof window !== 'undefined' && sessionStorage.getItem('auth:redirect') === '1';
  
  const [user, setUser] = useState(auth.currentUser); // Inicializar con usuario actual si existe
  const [loading, setLoading] = useState(hasRedirect && !hasCurrentUser); // Solo loading si hay redirect Y no hay usuario
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let authResolved = false;
    let tokenRefreshInterval = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
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
    
    // Manejar posible flujo de redirect en navegadores móviles
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          authResolved = true;
          if (isMounted) {
            setUser(result.user);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error en redirect:', err?.message);
        if (isMounted) {
          setError(err?.message || 'Error al procesar autenticación');
          setLoading(false);
        }
      }
      try { sessionStorage.removeItem('auth:redirect'); } catch (_) {}
    };
    
    handleRedirect();

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

  const login = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando proceso de login...');
      
      // Configurar persistencia antes del login
      console.log('📝 Configurando persistencia...');
      await ensurePersistence();
      
      // Detectar si es dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // En dispositivos móviles, usar redirect para mejor compatibilidad
        console.log('📱 Dispositivo móvil detectado, usando redirect...');
        try { sessionStorage.setItem('auth:redirect', '1'); } catch (_) {}
        await signInWithRedirect(auth, provider);
      } else {
        // En desktop, usar popup con timeout
        console.log('🖥️ Desktop detectado, usando popup...');
        const loginPromise = signInWithPopup(auth, provider);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 30000);
        });
        await Promise.race([loginPromise, timeoutPromise]);
      }
      
      // setLoading will be set to false by onAuthStateChanged
    } catch (err) {
      console.error('❌ Error en login:', err?.code || err?.message);
      
      let errorMessage = 'No se pudo iniciar sesión.';
      
      if (err?.message === 'TIMEOUT') {
        errorMessage = 'El login tardó demasiado. Verifica tu conexión y que el dominio esté autorizado en Firebase.';
      } else if (err?.code === 'auth/popup-blocked') {
        errorMessage = 'El popup fue bloqueado por el navegador. Habilita los popups e inténtalo de nuevo.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El popup fue cerrado antes de completar el login.';
      } else if (err?.code === 'auth/unauthorized-domain') {
        errorMessage = 'Este dominio no está autorizado en Firebase. Verifica la configuración.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMessage = 'El proveedor de Google no está habilitado en Firebase.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Se canceló la solicitud de popup anterior.';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { signInWithEmailAndPassword: signInEmail } = await import('../lib/firebase');
      await signInEmail(auth, email, password);
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
      const { createUserWithEmailAndPassword: createUser, updateProfile: updateProf } = await import('../lib/firebase');
      const result = await createUser(auth, email, password);
      
      // Actualizar displayName ANTES de que onAuthStateChanged propague el usuario
      if (displayName) {
        console.log('📝 Actualizando displayName:', displayName);
        await updateProf(result.user, { displayName });
        
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
