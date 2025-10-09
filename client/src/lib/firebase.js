// Firebase initialization for React client (modular SDK)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCs-vni2Zme9_K_mZgZkft2o9iytR541lQ',
  // SOLUCIÓN HÍBRIDA: Usar dominio personalizado solo en producción
  // En desarrollo y desktop, usar dominio Firebase (funciona bien)
  authDomain: window.location.hostname === 'impostor.me' 
    ? 'impostor.me'  // Producción: dominio personalizado para Safari iOS
    : 'impostor-468e0.firebaseapp.com', // Desarrollo: dominio Firebase
  projectId: 'impostor-468e0',
  storageBucket: 'impostor-468e0.appspot.com',
  messagingSenderId: '706542941882',
  appId: '1:706542941882:web:3625d2119579844b30f483',
  measurementId: 'G-PXH204ZK33',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configurar el proveedor de Google para solicitar permisos específicos
provider.addScope('profile');
provider.addScope('email');

// Configurar parámetros adicionales para mejorar la experiencia
provider.setCustomParameters({
  prompt: 'select_account'
});

async function ensurePersistence() {
  try {
    console.log('🔧 Configurando persistencia browserLocalPersistence...');
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Persistencia configurada exitosamente');
  } catch (e) {
    // no-op UI here; components will render error toast if needed
    console.error('❌ Error al configurar persistencia:', {
      code: e?.code,
      message: e?.message,
      stack: e?.stack,
    });
  }
}

export { app, auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };
