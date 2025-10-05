// Firebase initialization for React client (modular SDK)
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence, browserPopupRedirectResolver, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';

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
// Usar initializeAuth con resolvers/persistencias recomendadas para Safari iOS
// - indexedDBLocalPersistence primero, luego browserLocalPersistence
// - browserPopupRedirectResolver mejora el manejo del redirect/popup en Safari
let auth;
try {
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (_) {
  // Fallback si initializeAuth ya fue llamado (hot reload)
  auth = getAuth(app);
}
const provider = new GoogleAuthProvider();

// Configurar el proveedor de Google para solicitar permisos específicos
provider.addScope('profile');
provider.addScope('email');

// Configurar parámetros adicionales para mejorar la experiencia
// Nota: 'prompt: select_account' removido porque causa problemas en iOS 17
// provider.setCustomParameters({
//   prompt: 'select_account'
// });

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

export { app, auth, provider, ensurePersistence, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut };
