#!/usr/bin/env node
/**
 * Script para crear una partida de prueba con el schema antiguo (v1)
 * Esto sirve para probar la migración automática
 * 
 * Uso: node scripts/create-old-schema-game.js
 * 
 * Requiere: Variable de entorno FIREBASE_SERVICE_ACCOUNT (misma que usa el servidor)
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const admin = require("firebase-admin");

// Inicializar Firebase con la misma config que el servidor
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT no está definido");
    console.log("   Asegúrate de que apps/server/.env contiene la variable");
    process.exit(1);
}

try {
    const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(credentials) });
} catch (e) {
    console.error("❌ Error inicializando Firebase:", e.message);
    process.exit(1);
}

const db = admin.firestore();

async function createOldSchemaGame() {
    const gameId = "OLD" + Math.random().toString(36).substring(2, 5).toUpperCase();

    // Partida con schema viejo (sin schemaVersion)
    const oldGameData = {
        hostId: "ZVvWmAjbAJULm91kQMx5m3vgudi1",  // Leandro es el host
        phase: "playing",
        players: [
            { uid: "ZVvWmAjbAJULm91kQMx5m3vgudi1", name: "Leandro", photoURL: null },
            { uid: "imeRgdwSMpZWhFOogeSElWtZGAJ2", name: "Bea", photoURL: null },
            { uid: "0IUWLSB3zyb6Vuzc5ktRFaaoc4F2", name: "Juan", photoURL: null },
        ],
        playerScores: {
            "ZVvWmAjbAJULm91kQMx5m3vgudi1": 0,
            "imeRgdwSMpZWhFOogeSElWtZGAJ2": 0,
            "0IUWLSB3zyb6Vuzc5ktRFaaoc4F2": 0,
        },
        // Schema v1 usaba currentTurn/maxTurns
        currentTurn: 2,
        maxTurns: 3,
        eliminatedInRound: [],
        turnHistory: [],
        // NO tiene schemaVersion - esto lo marca como viejo
        // NO tiene currentRound/maxRounds
        secretWord: "test",
        secretCategory: "Test",
        impostorId: "imeRgdwSMpZWhFOogeSElWtZGAJ2",  // Bea es el impostor
        votes: {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
        await db.collection("games").doc(gameId).set(oldGameData);
        console.log(`\n✅ Partida de prueba creada: ${gameId}`);
        console.log(`   - Schema: v1 (sin schemaVersion)`);
        console.log(`   - Fase: playing`);
        console.log(`   - Host: Leandro`);
        console.log(`   - Jugadores: Leandro, Bea, Juan`);
        console.log(`   - Impostor: Bea`);
        console.log(`\n📌 Para probar:`);
        console.log(`   1. Reinicia el servidor (Ctrl+C, npm run dev)`);
        console.log(`   2. Los 3 usuarios se conectan`);
        console.log(`   3. Verán la pantalla "¡Nueva versión disponible!"`);
        console.log(`   4. Leandro (host) hace click en "Continuar a nueva sala"`);
        console.log(`   5. Todos aparecen juntos en el nuevo lobby\n`);
    } catch (error) {
        console.error("❌ Error creando partida:", error.message);
    }

    process.exit(0);
}

createOldSchemaGame();
