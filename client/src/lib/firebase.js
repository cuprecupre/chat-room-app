import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, onIdTokenChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCs-vni2Zme9_K_mZgZkft2o9iytR541lQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'impostor-468e0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'impostor-468e0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'impostor-468e0.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '706542941882',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:706542941882:web:3625d2119579844b30f483',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Configurar el proveedor de Google para solicitar permisos específicos
provider.addScope('profile');
provider.addScope('email');

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

export { app, auth, db, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, onIdTokenChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };
