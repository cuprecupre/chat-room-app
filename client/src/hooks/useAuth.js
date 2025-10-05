import { useState, useEffect, useCallback } from 'react';
import { auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  // Mostrar loading solo si venimos de un redirect de login
  const initialLoading = typeof window !== 'undefined' && sessionStorage.getItem('auth:redirect') === '1';
  const [loading, setLoading] = useState(Boolean(initialLoading));
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
      // Siempre limpiar el flag de redirect al terminar
      try { sessionStorage.removeItem('auth:redirect'); } catch (_) {}
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
      // Detectar si es dispositivo móvil e iOS
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const iOSVersion = isIOS ? parseFloat(
        (navigator.userAgent.match(/OS (\d+)_(\d+)/) || [])[1] + '.' + 
        (navigator.userAgent.match(/OS (\d+)_(\d+)/) || [])[2]
      ) : 0;
      
      console.log('🔍 Detección de dispositivo:', {
        isMobile,
        isIOS,
        iOSVersion,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });
      
      // En iOS < 18, NO configurar persistencia antes del redirect
      // Safari iOS 17 tiene problemas con setPersistence antes de signInWithRedirect
      if (!(isIOS && iOSVersion < 18)) {
        console.log('📝 Configurando persistencia...');
        await ensurePersistence();
        console.log('✅ Persistencia configurada correctamente');
      } else {
        console.log('📝 iOS < 18: Saltando configuración de persistencia para compatibilidad con redirect');
      }
      
      console.log('📱 Provider config:', {
        scopes: provider.getScopes(),
        customParameters: provider.getCustomParameters(),
      });
      
      // iOS 17 tiene problemas con popup, usar redirect directamente
      // iOS 18+ funciona bien con popup
      // En otros móviles, usar redirect
      // En desktop, usar popup
      if (isIOS && iOSVersion < 18) {
        console.log('📱 iOS < 18 detectado, usando signInWithRedirect directamente...');
        console.log('📱 (iOS 17 tiene problemas conocidos con popups de Firebase)');
        try {
          // Marcar que vamos a redirect para mostrar loader al volver
          try { sessionStorage.setItem('auth:redirect', '1'); } catch (_) {}
          await signInWithRedirect(auth, provider);
          console.log('📱 signInWithRedirect llamado - redirigiendo...');
        } catch (redirectError) {
          console.error('❌ Error en signInWithRedirect:', {
            code: redirectError?.code,
            message: redirectError?.message,
            stack: redirectError?.stack,
          });
          throw redirectError;
        }
      } else if (isIOS && iOSVersion >= 18) {
        console.log('📱 iOS 18+ detectado, usando signInWithPopup...');
        try {
          const loginPromise = signInWithPopup(auth, provider);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('POPUP_TIMEOUT')), 30000);
          });
          
          console.log('📱 Esperando resultado del popup en iOS...');
          const result = await Promise.race([loginPromise, timeoutPromise]);
          console.log('✅ Login exitoso con popup en iOS:', {
            displayName: result.user?.displayName,
            email: result.user?.email,
            uid: result.user?.uid,
          });
        } catch (popupError) {
          console.warn('⚠️ Popup falló en iOS 18+, usando redirect como fallback:', popupError.code);
          try { sessionStorage.setItem('auth:redirect', '1'); } catch (_) {}
          await signInWithRedirect(auth, provider);
          console.log('📱 signInWithRedirect llamado - redirigiendo...');
        }
      } else if (isMobile) {
        console.log('📱 Dispositivo móvil (no iOS) detectado, usando signInWithRedirect...');
        try { sessionStorage.setItem('auth:redirect', '1'); } catch (_) {}
        await signInWithRedirect(auth, provider);
        console.log('📱 signInWithRedirect llamado - redirigiendo...');
      } else {
        console.log('🖥️ Dispositivo desktop, usando signInWithPopup...');
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

  const loginWithEmail = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📧 Iniciando sesión con email...');
      const { signInWithEmailAndPassword: signInEmail } = await import('../lib/firebase');
      const result = await signInEmail(auth, email, password);
      console.log('✅ Login con email exitoso:', result.user.email);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error login con email:', err);
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
        while (!auth.currentUser?.displayName && retries < 10) {
          console.log('⏳ Esperando a que displayName se actualice...');
          await new Promise(resolve => setTimeout(resolve, 100));
          await auth.currentUser?.reload();
          retries++;
        }
        
        console.log('✅ DisplayName actualizado:', auth.currentUser?.displayName);
        console.log('✅ Token actualizado con nuevo displayName');
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
      await signOut(auth);
    } catch (err) {
      console.error('Logout Error:', err);
      setError(err.message || 'No se pudo cerrar la sesión.');
    }
  }, []);

  return { user, loading, error, login, loginWithEmail, registerWithEmail, logout };
}
