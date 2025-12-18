import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
    signInWithRedirect,
    signInWithPopup,
    getRedirectResult,
    onAuthStateChanged,
    onIdTokenChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
};

if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.storageBucket ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId
) {
    throw new Error("Firebase config is not set");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Configurar el proveedor de Google para solicitar permisos específicos
provider.addScope("profile");
provider.addScope("email");

async function ensurePersistence() {
    try {
        console.log("🔧 Configurando persistencia browserLocalPersistence...");
        await setPersistence(auth, browserLocalPersistence);
        console.log("✅ Persistencia configurada exitosamente");
    } catch (e) {
        // no-op UI here; components will render error toast if needed
        console.error("❌ Error al configurar persistencia:", {
            code: e?.code,
            message: e?.message,
            stack: e?.stack,
        });
    }
}

export {
    app,
    auth,
    db,
    provider,
    ensurePersistence,
    signInWithRedirect,
    signInWithPopup,
    getRedirectResult,
    onAuthStateChanged,
    onIdTokenChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
};
