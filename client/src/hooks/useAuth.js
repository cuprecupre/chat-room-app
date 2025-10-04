import { useState, useEffect, useCallback } from 'react';
import { auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔧 Inicializando listener de autenticación...');
    console.log('🔍 Usuario actual al inicializar:', auth.currentUser);
    
    let isMounted = true;
    let authResolved = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log('🔄 Estado de autenticación cambió:', u ? `Usuario: ${u.displayName}` : 'Sin usuario');
      authResolved = true;
      if (isMounted) {
        setUser(u);
        setLoading(false);
      }
    });
    
    // Manejar posible flujo de redirect en navegadores móviles
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Redirect result exitoso:', result.user?.displayName);
          authResolved = true;
          if (isMounted) {
            setUser(result.user);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('❌ Error en redirect result:', err?.code || err?.message || err);
        if (isMounted) {
          setError(err?.message || 'Error al procesar autenticación');
          setLoading(false);
        }
      }
    };
    
    handleRedirect();

    // Timeout de seguridad solo si la autenticación no se resuelve
    const timeout = setTimeout(() => {
      if (!authResolved && isMounted) {
        console.warn('⚠️ Timeout de inicialización de Firebase Auth');
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('🔄 Iniciando proceso de login...');
    
    try {
      console.log('📝 Configurando persistencia...');
      await ensurePersistence();
      
      // Detectar si es dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Dispositivo móvil detectado, usando signInWithRedirect...');
        // En móvil, usar redirect que es más confiable
        await signInWithRedirect(auth, provider);
        // El resultado se manejará en getRedirectResult al cargar la página
      } else {
        console.log('🖥️ Dispositivo desktop, usando signInWithPopup...');
        // En desktop, usar popup
        const loginPromise = signInWithPopup(auth, provider);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30 segundos
        });
        
        const result = await Promise.race([loginPromise, timeoutPromise]);
        console.log('✅ Login exitoso:', result.user?.displayName);
      }
      
      // setLoading will be set to false by onAuthStateChanged
    } catch (err) {
      console.error('❌ Error en login:', err);
      console.error('Código de error:', err?.code);
      console.error('Mensaje completo:', err);
      
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

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout Error:', err);
      setError(err.message || 'No se pudo cerrar la sesión.');
    }
  }, []);

  return { user, loading, error, login, logout };
}
