import { useState, useEffect, useCallback } from 'react';
import { auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔧 Inicializando listener de autenticación...');
    console.log('🔍 Usuario actual al inicializar:', auth.currentUser);
    
    // Verificar si ya hay un usuario autenticado
    if (auth.currentUser) {
      console.log('✅ Usuario ya autenticado encontrado:', auth.currentUser.displayName);
      setUser(auth.currentUser);
      setLoading(false);
    }
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log('🔄 Estado de autenticación cambió:', u ? `Usuario: ${u.displayName}` : 'Sin usuario');
      setUser(u);
      setLoading(false);
    });

    // Timeout de seguridad para evitar loading infinito
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout de inicialización de Firebase Auth');
      if (auth.currentUser) {
        console.log('🔄 Aplicando usuario actual por timeout:', auth.currentUser.displayName);
        setUser(auth.currentUser);
      }
      setLoading(false);
    }, 5000);

    return () => {
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
      
      console.log('🚀 Abriendo popup de Google...');
      
      // Crear una promesa con timeout para evitar que se quede colgado
      const loginPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30 segundos
      });
      
      const result = await Promise.race([loginPromise, timeoutPromise]);
      console.log('✅ Login exitoso:', result.user?.displayName);
      
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
