import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    EmailAuthProvider,
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
    signInAnonymously,
    updateProfile,
    sendPasswordResetEmail,
    getAdditionalUserInfo,
    linkWithPopup,
    linkWithCredential,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Configurar el proveedor de Google para solicitar permisos específicos
provider.addScope("profile");
provider.addScope("email");

// Forzar selector de cuentas en cada login
provider.setCustomParameters({
    prompt: "select_account",
});

async function ensurePersistence() {
    try {
        await setPersistence(auth, browserLocalPersistence);
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
    storage,
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
    signInAnonymously,
    updateProfile,
    sendPasswordResetEmail,
    getAdditionalUserInfo,
    linkWithPopup,
    linkWithCredential,
    EmailAuthProvider,
    ref,
    uploadBytes,
    getDownloadURL,
};
