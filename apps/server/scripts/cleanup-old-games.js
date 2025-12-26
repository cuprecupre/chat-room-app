#!/usr/bin/env node
/**
 * Script para limpiar partidas con schema viejo de Firestore
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const admin = require("firebase-admin");

// Inicializar Firebase
const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(credentials) });

const db = admin.firestore();

async function cleanup() {
    // Borrar partidas con needs_migration
    const needsMigration = await db
        .collection("games")
        .where("phase", "==", "needs_migration")
        .get();

    console.log(`Borrando ${needsMigration.size} partidas con needs_migration...`);
    for (const doc of needsMigration.docs) {
        await doc.ref.delete();
        console.log(`  Borrada: ${doc.id}`);
    }

    // También borrar partidas OLD* que tengan schemaVersion < 2
    const allGames = await db.collection("games").get();
    let deleted = 0;
    for (const doc of allGames.docs) {
        const data = doc.data();
        const schemaVersion = data.schemaVersion || 1;
        if (doc.id.startsWith("OLD") && schemaVersion < 2) {
            await doc.ref.delete();
            console.log(`  Borrada OLD: ${doc.id}`);
            deleted++;
        }
    }

    console.log(`\n✅ Limpieza completada. ${needsMigration.size + deleted} partidas borradas.`);
    process.exit(0);
}

cleanup().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});
