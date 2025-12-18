const admin = require("firebase-admin");
const path = require("path");

let initialized = false;

function initializeFirebase() {
    if (initialized) return admin;

    // Preferred: FIREBASE_SERVICE_ACCOUNT as full JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({ credential: admin.credential.cert(json) });
            console.log("Firebase Admin inicializado con FIREBASE_SERVICE_ACCOUNT.");
            initialized = true;
            return admin;
        } catch (e) {
            console.error("FIREBASE_SERVICE_ACCOUNT inválido. Intentando alternativas...");
        }
    }

    // Try local credential files
    const candidates = [
        path.join(__dirname, "..", "..", "firebase-service-account.json"),
        path.join(__dirname, "..", "..", "serviceAccountKey.json"),
    ];

    for (const p of candidates) {
        if (!initialized) {
            try {
                const serviceAccount = require(p);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log(`Firebase Admin inicializado con ${p}.`);
                initialized = true;
                return admin;
            } catch (_) {
                // Continue to next candidate
            }
        }
    }

    // Last resort: application default credentials
    if (!initialized) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            console.log("Firebase Admin inicializado con applicationDefault().");
            initialized = true;
            return admin;
        } catch (e) {
            console.error("No se pudo inicializar Firebase Admin.");
            console.error(
                "Proporciona 'FIREBASE_SERVICE_ACCOUNT' como variable de entorno, 'firebase-service-account.json' o 'serviceAccountKey.json' en la raíz, o configura GOOGLE_APPLICATION_CREDENTIALS."
            );
            process.exit(1);
        }
    }

    return admin;
}

module.exports = { initializeFirebase, admin };
