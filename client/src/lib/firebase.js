// Firebase initialization for React client (modular SDK)
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCs-vni2Zme9_K_mZgZkft2o9iytR541lQ',
  authDomain: 'impostor-468e0.firebaseapp.com',
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
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    // no-op UI here; components will render error toast if needed
    console.error('Auth persistence error:', e);
  }
}

export { app, auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut };
