import { useState, useEffect, useCallback } from 'react';
import { auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔧 Inicializando listener de autenticación...');
    console.log('🔍 Usuario actual al inicializar:', auth.currentUser);
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🔗 URL actual:', window.location.href);
    console.log('🔗 URL params:', new URLSearchParams(window.location.search).toString());
    
    let isMounted = true;
    let authResolved = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log('🔄 Estado de autenticación cambió:', u ? `Usuario: ${u.displayName} (${u.email})` : 'Sin usuario');
      console.log('🔄 Detalles del usuario:', u ? {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        emailVerified: u.emailVerified,
        providerId: u.providerId,
      } : null);
      authResolved = true;
      if (isMounted) {
        setUser(u);
        setLoading(false);
      }
    });
    
    // Manejar posible flujo de redirect en navegadores móviles
    const handleRedirect = async () => {
      console.log('🔄 Iniciando handleRedirect...');
      try {
        console.log('🔄 Esperando getRedirectResult...');
        const result = await getRedirectResult(auth);
        console.log('🔄 getRedirectResult completado:', result ? 'Con resultado' : 'Sin resultado');
        if (result) {
          console.log('✅ Redirect result exitoso:', result.user?.displayName);
          console.log('✅ Detalles completos del redirect:', {
            user: {
              uid: result.user?.uid,
              email: result.user?.email,
              displayName: result.user?.displayName,
              photoURL: result.user?.photoURL,
              emailVerified: result.user?.emailVerified,
            },
            operationType: result.operationType,
            providerId: result.providerId,
          });
          authResolved = true;
          if (isMounted) {
            setUser(result.user);
            setLoading(false);
          }
        } else {
          console.log('ℹ️ No hay resultado de redirect (normal si no vino de redirect)');
        }
      } catch (err) {
        console.error('❌ Error en redirect result:', {
          code: err?.code,
          message: err?.message,
          stack: err?.stack,
          customData: err?.customData,
        });
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
    console.log('🔄 Estado inicial - auth.currentUser:', auth.currentUser);
    
    try {
      console.log('📝 Configurando persistencia...');
      await ensurePersistence();
      console.log('✅ Persistencia configurada correctamente');
      
      // Detectar si es dispositivo móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log('🔍 Detección de dispositivo:', {
        isMobile,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });
      
      if (isMobile) {
        console.log('📱 Dispositivo móvil detectado, usando signInWithRedirect...');
        console.log('📱 Provider config:', {
          scopes: provider.getScopes(),
          customParameters: provider.getCustomParameters(),
        });
        // En móvil, usar redirect que es más confiable
        await signInWithRedirect(auth, provider);
        console.log('📱 signInWithRedirect llamado - redirigiendo...');
        // El resultado se manejará en getRedirectResult al cargar la página
      } else {
        console.log('🖥️ Dispositivo desktop, usando signInWithPopup...');
        console.log('🖥️ Provider config:', {
          scopes: provider.getScopes(),
          customParameters: provider.getCustomParameters(),
        });
        // En desktop, usar popup
        const loginPromise = signInWithPopup(auth, provider);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30 segundos
        });
        
        console.log('🖥️ Esperando resultado del popup...');
        const result = await Promise.race([loginPromise, timeoutPromise]);
        console.log('✅ Login exitoso con popup:', {
          displayName: result.user?.displayName,
          email: result.user?.email,
          uid: result.user?.uid,
        });
      }
      
      // setLoading will be set to false by onAuthStateChanged
    } catch (err) {
      console.error('❌ Error en login:', err);
      console.error('❌ Código de error:', err?.code);
      console.error('❌ Mensaje:', err?.message);
      console.error('❌ Stack:', err?.stack);
      console.error('❌ Objeto completo:', JSON.stringify(err, null, 2));
      
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
