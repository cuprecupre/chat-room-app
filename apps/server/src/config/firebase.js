const admin = require("firebase-admin");

let initialized = false;

function initializeFirebase() {
    if (initialized) return admin;

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.error("FIREBASE_SERVICE_ACCOUNT environment variable is required");
        process.exit(1);
    }

    try {
        const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(credentials) });
        console.log("✅ Firebase Admin initialized");
        initialized = true;
    } catch (e) {
        console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT JSON:", e.message);
        process.exit(1);
    }

    return admin;
}

module.exports = { initializeFirebase, admin };
