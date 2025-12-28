/**
 * SIMULACIÓN MATEMÁTICA EXHAUSTIVA
 * 
 * Este test explora EL 100% de las combinaciones de votos posibles para una partida
 * de 3 jugadores, verificando que en TODOS los universos posibles se cumplen
 * las reglas de puntuación.
 */

const ScoringManager = require("../game/ScoringManager");

// Configuración
const PLAYERS = ["impostor", "friend1", "friend2"];
const MAX_ROUNDS = 3;

/**
 * Crea un estado de juego inicial limpio
 */
function createInitialGame() {
    return {
        gameId: "SIM",
        players: PLAYERS.map(uid => ({ uid, name: uid })),
        impostorId: "impostor",
        playerScores: Object.fromEntries(PLAYERS.map(p => [p, 0])),
        lastRoundScores: {},
        currentRound: 1,
        maxRounds: MAX_ROUNDS,
        votes: {},
        correctVotesPerPlayer: {}, // Reset!
        playerBonus: {},           // Reset!
        eliminatedPlayers: [],
        activePlayers: [...PLAYERS],
        history: [] // Para debug: rastro de qué pasó para llegar aquí
    };
}

/**
 * Genera todas las permutaciones posibles de votos para los jugadores activos
 * @param {Array} currentVoters - Lista de jugadores que faltan por asignar voto
 * @param {Array} allCandidates - Todos los jugadores activos (para ser targets)
 */
function generateVoteCombinations(currentVoters, allCandidates) {
    if (currentVoters.length === 0) return [{}];

    const firstVoter = currentVoters[0];
    const remainingVoters = currentVoters.slice(1);
    const partialCombinations = generateVoteCombinations(remainingVoters, allCandidates);
    const combinations = [];

    // El votante puede votar a cualquiera menos a sí mismo
    const possibleTargets = allCandidates.filter(p => p !== firstVoter);

    possibleTargets.forEach(target => {
        partialCombinations.forEach(partial => {
            combinations.push({
                ...partial,
                [firstVoter]: target
            });
        });
    });

    return combinations;
}

/**
 * Clona el juego profundamente
 */
function cloneGame(game) {
    return JSON.parse(JSON.stringify(game));
}

// Stats globales
let totalScenarios = 0;
let validScenarios = 0;
let errorScenarios = 0;

describe("Simulación Exhaustiva: El Multiverso de Votos (3 Jugadores)", () => {

    // Función recursiva que explora todo el árbol de decisiones
    function simulateRound(game) {
        // 1. Generar todos los votos posibles para esta ronda
        const voteCombinations = generateVoteCombinations(game.activePlayers, game.activePlayers);

        voteCombinations.forEach(votes => {
            const stepGame = cloneGame(game);
            stepGame.votes = votes;

            // --- FASE 1: Puntos por votar bien ---
            ScoringManager.giveCorrectVotersPoints(stepGame);

            // --- FASE 2: Determinar eliminación ---
            // Contar votos
            const voteCounts = {};
            stepGame.activePlayers.forEach(p => voteCounts[p] = 0);
            Object.values(votes).forEach(target => voteCounts[target] = (voteCounts[target] || 0) + 1);

            // Encontrar más votado(s)
            let maxVotes = 0;
            Object.values(voteCounts).forEach(c => { if (c > maxVotes) maxVotes = c; });
            const mostVoted = Object.keys(voteCounts).filter(p => voteCounts[p] === maxVotes);

            // Lógica de resolución
            let roundOutcome = "";
            let isGameOver = false;

            if (mostVoted.length > 1) {
                // EMPATE
                roundOutcome = "TIE";
                ScoringManager.giveImpostorSurvivalPoints(stepGame);

                if (stepGame.currentRound >= stepGame.maxRounds) {
                    // Fin de juego: Impostor gana R3 por empate
                    ScoringManager.giveImpostorMaxPoints(stepGame);
                    stepGame.winnerId = stepGame.impostorId;
                    isGameOver = true;
                } else {
                    // Siguiente ronda
                    stepGame.currentRound++;
                }

            } else {
                // ELIMINACIÓN
                const eliminated = mostVoted[0];
                stepGame.eliminatedPlayers.push(eliminated);
                stepGame.activePlayers = stepGame.activePlayers.filter(p => p !== eliminated);

                if (eliminated === stepGame.impostorId) {
                    // IMPOSTOR CAZADO
                    roundOutcome = "IMPOSTOR_CAUGHT";
                    ScoringManager.calculateRoundScores(stepGame, true);
                    // Amigos ganan (friend con más score)
                    isGameOver = true; // Ya se dieron puntos y bonus en calculateRoundScores

                } else {
                    // AMIGO ELIMINADO
                    roundOutcome = "FRIEND_ELIMINATED";
                    ScoringManager.giveImpostorSurvivalPoints(stepGame);

                    if (stepGame.activePlayers.length <= 2) {
                        // MUERTE SÚBITA
                        roundOutcome = "SUDDEN_DEATH";
                        ScoringManager.giveImpostorMaxPoints(stepGame);
                        stepGame.winnerId = stepGame.impostorId;
                        isGameOver = true;
                    } else if (stepGame.currentRound >= stepGame.maxRounds) {
                        // Fin R3: Impostor sobrevive
                        roundOutcome = "IMPOSTOR_SURVIVED_R3";
                        ScoringManager.giveImpostorMaxPoints(stepGame);
                        stepGame.winnerId = stepGame.impostorId;
                        isGameOver = true;
                    } else {
                        // Siguiente ronda
                        stepGame.currentRound++;
                    }
                }
            }

            // --- FASE 3: Recursión o Verificación ---
            if (isGameOver) {
                verifyInvariants(stepGame);
                totalScenarios++;
            } else {
                simulateRound(stepGame);
            }
        });
    }

    /**
     * Verifica las reglas INVARIANTES del sistema
     * Si esto falla, hay un bug matemático.
     */
    function verifyInvariants(game) {
        const impostorScore = game.playerScores["impostor"];
        const friends = formatScores(game); // Helper para debug si falla

        try {
            // 1. Impostor Scores Cap
            if (impostorScore > 10) throw new Error(`Impostor > 10 pts: ${impostorScore}`);

            // 2. Si Impostor Gana -> Debe tener 10 pts
            if (game.winnerId === "impostor") {
                if (impostorScore !== 10) throw new Error(`Impostor ganó con ${impostorScore} pts (debería ser 10)`);
                if (!game.playerBonus["impostor"]) throw new Error("Impostor ganó pero no tiene registro de bonus");
            }

            // 3. Si Amigos Ganan -> Verificar Bonus
            if (game.winnerId !== "impostor" && !game.winnerId) { // calculateRoundScores no setea winnerId explicitamente en el objeto game a veces en tests unitarios dependiendo del mock, pero aquí usamos lógica real
                // En la logica real, calculateFriendsWinScores da el bonus. Verifiquemos quien tiene bonus.
                const bonusReceivers = Object.keys(game.playerBonus || {});

                // Identificar Amigo Perfecto
                const perfectFriends = Object.entries(game.correctVotesPerPlayer)
                    .filter(([pid, votes]) => votes === game.currentRound)
                    .map(([pid]) => pid);

                if (perfectFriends.length > 0) {
                    // ALGUIEN debe tener bonus 10 pts
                    const winner = bonusReceivers[0];
                    if (!winner) throw new Error("Hubo amigo perfecto pero NADIE recibió bonus");
                    if (game.playerScores[winner] !== 10) throw new Error(`Ganador ${winner} tiene ${game.playerScores[winner]} pts, esperaba 10`);
                } else {
                    // Nadie perfecto -> nadie tiene bonus
                    if (bonusReceivers.length > 0) throw new Error("Nadie fue perfecto pero alguien recibió bonus");
                    // Nadie debe tener 10 pts (a menos que llegaran naturalmente a 10? No posible para amigos, max natural 6)
                    Object.entries(game.playerScores).forEach(([p, s]) => {
                        if (p !== "impostor" && s >= 10) throw new Error(`Amigo ${p} tiene ${s} pts sin ser perfecto`);
                    });
                }
            }

            // 4. Paridad de puntuaciones (todo es múltiplo de 2 o +bonus para llegar a 10)
            Object.values(game.playerScores).forEach(s => {
                if (s % 2 !== 0) throw new Error(`Puntuación impar detectada: ${s}`);
            });

            validScenarios++;
        } catch (e) {
            errorScenarios++;
            console.error("\n❌ FALLO EN ESCENARIO:");
            console.error("Ronda Final:", game.currentRound);
            console.error("Votos Ronda Final:", game.votes);
            console.error("Scores:", game.playerScores);
            console.error("Bonus:", game.playerBonus);
            console.error("CorrectVotes:", game.correctVotesPerPlayer);
            console.error("Error:", e.message);
            throw e; // Fail test
        }
    }

    function formatScores(game) {
        return JSON.stringify(game.playerScores);
    }

    test("Verificar todas las combinaciones posibles (3 jugadores)", () => {
        const initialGame = createInitialGame();
        simulateRound(initialGame);

        console.log(`\n✅ Simulación completada: ${totalScenarios} escenarios de juego finales verificados.`);
        expect(errorScenarios).toBe(0);
        expect(totalScenarios).toBeGreaterThan(40); // Sanity check
    });

});
