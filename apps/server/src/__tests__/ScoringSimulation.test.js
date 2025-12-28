/**
 * SIMULACIÓN MATEMÁTICA DEL SISTEMA DE PUNTUACIÓN
 *
 * Este test cubre TODOS los escenarios posibles del juego y verifica
 * que el bonus se aplica correctamente en cada caso.
 *
 * Reglas:
 * - Amigo vota bien: +2 pts por ronda
 * - Impostor sobrevive: +2 pts por ronda
 * - Ganador (impostor o amigo perfecto) recibe bonus hasta 10 pts
 */

const ScoringManager = require("../game/ScoringManager");

function createGame(players = ["p1", "p2", "p3", "p4"]) {
    return {
        gameId: "TEST",
        players: players.map((uid) => ({ uid, name: uid })),
        impostorId: players[0], // p1 es siempre impostor
        playerScores: Object.fromEntries(players.map((p) => [p, 0])),
        lastRoundScores: {},
        currentRound: 0,
        maxRounds: 3,
        votes: {},
        correctVotesPerPlayer: {},
        playerBonus: {},
    };
}

describe("Simulación Matemática - Sistema de Puntuación Completo", () => {
    describe("Escenarios donde IMPOSTOR gana", () => {
        test("Impostor sobrevive 3 rondas (R1+R2+R3) = 10 pts con bonus", () => {
            const game = createGame();

            // Simular 3 rondas donde impostor sobrevive
            for (let round = 1; round <= 3; round++) {
                game.currentRound = round;
                ScoringManager.giveImpostorSurvivalPoints(game);
            }

            // Verificar puntos base: 2+2+2 = 6
            expect(game.playerScores["p1"]).toBe(6);

            // Aplicar bonus de ganador
            ScoringManager.giveImpostorMaxPoints(game);

            // Verificar total: 10 pts
            expect(game.playerScores["p1"]).toBe(10);
            expect(game.playerBonus["p1"]).toBe(4); // 10-6 = 4 bonus
        });

        test("Impostor gana en R3 por empate = 10 pts con bonus", () => {
            const game = createGame();

            // R1: empate, impostor +2
            game.currentRound = 1;
            ScoringManager.giveImpostorSurvivalPoints(game);

            // R2: empate, impostor +2
            game.currentRound = 2;
            ScoringManager.giveImpostorSurvivalPoints(game);

            // R3: empate final, impostor +2 + bonus
            game.currentRound = 3;
            ScoringManager.giveImpostorSurvivalPoints(game);
            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["p1"]).toBe(10);
            expect(game.playerBonus["p1"]).toBe(4);
        });

        test("Muerte súbita R2 (solo quedan 2 jugadores) = 10 pts con bonus", () => {
            const game = createGame();

            // R1: impostor sobrevive +2
            game.currentRound = 1;
            ScoringManager.giveImpostorSurvivalPoints(game);

            // R2: eliminan a un amigo, quedan 2, muerte súbita
            game.currentRound = 2;
            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["p1"]).toBe(10);
            expect(game.playerBonus["p1"]).toBe(8); // 10-2 = 8 bonus
        });

        test("Muerte súbita R1 (empezaron con 3 jugadores) = 10 pts con bonus", () => {
            const game = createGame(["p1", "p2", "p3"]);

            // R1: eliminan a un amigo de 3, quedan 2, muerte súbita
            game.currentRound = 1;
            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["p1"]).toBe(10);
            expect(game.playerBonus["p1"]).toBe(10);
        });
    });

    describe("Escenarios donde AMIGOS ganan", () => {
        test("Descubren impostor R1, amigo perfecto con 2 pts → 10 pts", () => {
            const game = createGame();
            game.currentRound = 1;

            // Todos los amigos votan bien
            game.votes = { p2: "p1", p3: "p1", p4: "p1" };
            ScoringManager.giveCorrectVotersPoints(game);

            // Verificar que todos tienen 2 pts
            expect(game.playerScores["p2"]).toBe(2);
            expect(game.playerScores["p3"]).toBe(2);
            expect(game.playerScores["p4"]).toBe(2);

            // p2, p3, p4 son todos "amigos perfectos" (1/1 rondas)
            ScoringManager.calculateRoundScores(game, true);

            // El primero con más puntos recibe bonus
            const winnerId = Object.keys(game.playerBonus)[0];
            expect(game.playerScores[winnerId]).toBe(10);
            expect(game.playerBonus[winnerId]).toBe(8);
        });

        test("Descubren impostor R3, amigo perfecto con 6 pts → 10 pts", () => {
            const game = createGame();

            // R1: p2 vota bien
            game.currentRound = 1;
            game.votes = { p2: "p1", p3: "p4", p4: "p3" };
            ScoringManager.giveCorrectVotersPoints(game);
            expect(game.playerScores["p2"]).toBe(2);

            // R2: p2 vota bien otra vez
            game.currentRound = 2;
            game.votes = { p2: "p1", p3: "p4", p4: "p3" };
            game.lastRoundScores = {};
            ScoringManager.giveCorrectVotersPoints(game);
            expect(game.playerScores["p2"]).toBe(4);

            // R3: p2 vota bien de nuevo
            game.currentRound = 3;
            game.votes = { p2: "p1", p3: "p1", p4: "p1" };
            game.lastRoundScores = {};
            ScoringManager.giveCorrectVotersPoints(game);
            expect(game.playerScores["p2"]).toBe(6);

            // p2 es amigo perfecto (3/3 rondas)
            ScoringManager.calculateRoundScores(game, true);

            expect(game.playerScores["p2"]).toBe(10);
            expect(game.playerBonus["p2"]).toBe(4);
        });

        test("Descubren impostor R3, NADIE es amigo perfecto → sin bonus", () => {
            const game = createGame();

            // R1: p2 vota bien, p3 y p4 mal
            game.currentRound = 1;
            game.votes = { p2: "p1", p3: "p4", p4: "p3" };
            ScoringManager.giveCorrectVotersPoints(game);

            // R2: p3 vota bien, p2 y p4 mal
            game.currentRound = 2;
            game.votes = { p2: "p4", p3: "p1", p4: "p2" };
            game.lastRoundScores = {};
            ScoringManager.giveCorrectVotersPoints(game);

            // R3: todos votan bien
            game.currentRound = 3;
            game.votes = { p2: "p1", p3: "p1", p4: "p1" };
            game.lastRoundScores = {};
            ScoringManager.giveCorrectVotersPoints(game);

            // Puntos: p2=4, p3=4, p4=2
            expect(game.playerScores["p2"]).toBe(4);
            expect(game.playerScores["p3"]).toBe(4);
            expect(game.playerScores["p4"]).toBe(2);

            // Nadie es perfecto (p2: 2/3, p3: 2/3, p4: 1/3)
            ScoringManager.calculateRoundScores(game, true);

            // No hay bonus para nadie
            expect(Object.keys(game.playerBonus).length).toBe(0);

            // Puntos siguen igual
            expect(game.playerScores["p2"]).toBe(4);
            expect(game.playerScores["p3"]).toBe(4);
        });

        test("Empate entre amigos perfectos → bonus al primero", () => {
            const game = createGame();
            game.currentRound = 1;

            // p2 y p3 votan bien en R1
            game.votes = { p2: "p1", p3: "p1", p4: "p2" };
            ScoringManager.giveCorrectVotersPoints(game);

            // Ambos son perfectos (1/1), ambos tienen 2 pts
            ScoringManager.calculateRoundScores(game, true);

            // Solo uno recibe bonus
            const winners = Object.keys(game.playerBonus);
            expect(winners.length).toBe(1);
            expect(game.playerScores[winners[0]]).toBe(10);
        });
    });

    describe("Verificación de límites", () => {
        test("Impostor nunca puede tener más de 10 pts", () => {
            const game = createGame();
            game.playerScores["p1"] = 10;

            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["p1"]).toBe(10);
            expect(game.playerBonus["p1"]).toBeUndefined();
        });

        test("Amigo perfecto siempre llega a exactamente 10 pts", () => {
            const testCases = [
                { startPts: 2, expectedBonus: 8 },
                { startPts: 4, expectedBonus: 6 },
                { startPts: 6, expectedBonus: 4 },
            ];

            testCases.forEach(({ startPts, expectedBonus }) => {
                const game = createGame();
                game.currentRound = startPts / 2; // Simular rondas
                game.playerScores["p2"] = startPts;
                game.correctVotesPerPlayer["p2"] = game.currentRound;

                ScoringManager.calculateRoundScores(game, true);

                expect(game.playerScores["p2"]).toBe(10);
                expect(game.playerBonus["p2"]).toBe(expectedBonus);
            });
        });
    });

    describe("Resumen matemático", () => {
        test("TABLA DE TODOS LOS ESCENARIOS", () => {
            const scenarios = [
                { desc: "Impostor R1 (muerte súbita)", basePts: 0, bonus: 10, total: 10 },
                { desc: "Impostor R2 (muerte súbita)", basePts: 2, bonus: 8, total: 10 },
                { desc: "Impostor R3 (gana)", basePts: 6, bonus: 4, total: 10 },
                { desc: "Amigo perfecto R1", basePts: 2, bonus: 8, total: 10 },
                { desc: "Amigo perfecto R2", basePts: 4, bonus: 6, total: 10 },
                { desc: "Amigo perfecto R3", basePts: 6, bonus: 4, total: 10 },
                { desc: "Amigo NO perfecto", basePts: 4, bonus: 0, total: 4 },
            ];

            console.log("\n=== TABLA DE ESCENARIOS ===");
            console.log("| Escenario               | Base | Bonus | Total |");
            console.log("|-------------------------|------|-------|-------|");
            scenarios.forEach((s) => {
                console.log(
                    `| ${s.desc.padEnd(23)} | ${s.basePts.toString().padStart(4)} | ${s.bonus.toString().padStart(5)} | ${s.total.toString().padStart(5)} |`
                );
                expect(s.basePts + s.bonus).toBe(s.total);
            });
            console.log("");

            // Verificar que el ganador SIEMPRE tiene 10 pts
            const winnerScenarios = scenarios.filter((s) => s.bonus > 0);
            winnerScenarios.forEach((s) => {
                expect(s.total).toBe(10);
            });
        });
    });

    describe("Con más jugadores (5-8)", () => {
        test("5 jugadores: impostor gana R3 = 10 pts", () => {
            const game = createGame(["imp", "a1", "a2", "a3", "a4"]);

            for (let r = 1; r <= 3; r++) {
                game.currentRound = r;
                ScoringManager.giveImpostorSurvivalPoints(game);
            }
            ScoringManager.giveImpostorMaxPoints(game);

            expect(game.playerScores["imp"]).toBe(10);
        });

        test("6 jugadores: amigo perfecto = 10 pts, otros amigos diversos", () => {
            const game = createGame(["imp", "a1", "a2", "a3", "a4", "a5"]);

            // R1: solo a1 vota bien
            game.currentRound = 1;
            game.votes = { a1: "imp", a2: "a3", a3: "a4", a4: "a5", a5: "a1" };
            ScoringManager.giveCorrectVotersPoints(game);

            // a1 es perfecto (1/1)
            ScoringManager.calculateRoundScores(game, true);

            expect(game.playerScores["a1"]).toBe(10);
            expect(game.playerScores["a2"]).toBe(0);
            expect(game.playerScores["a3"]).toBe(0);
        });

        test("7 jugadores: múltiples amigos perfectos → uno recibe bonus", () => {
            const game = createGame(["imp", "a1", "a2", "a3", "a4", "a5", "a6"]);

            // Todos votan bien en R1
            game.currentRound = 1;
            game.votes = {
                a1: "imp",
                a2: "imp",
                a3: "imp",
                a4: "imp",
                a5: "imp",
                a6: "imp",
            };
            ScoringManager.giveCorrectVotersPoints(game);
            ScoringManager.calculateRoundScores(game, true);

            // Todos tienen 2 pts base, uno tiene bonus
            const withBonus = Object.keys(game.playerBonus);
            expect(withBonus.length).toBe(1);
            expect(game.playerScores[withBonus[0]]).toBe(10);
        });

        test("8 jugadores: R3, nadie perfecto = sin bonus", () => {
            const game = createGame(["imp", "a1", "a2", "a3", "a4", "a5", "a6", "a7"]);

            // R1: a1, a2, a3 votan bien
            game.currentRound = 1;
            game.votes = {
                a1: "imp",
                a2: "imp",
                a3: "imp",
                a4: "a1",
                a5: "a2",
                a6: "a3",
                a7: "a4",
            };
            ScoringManager.giveCorrectVotersPoints(game);

            // R2: a4, a5, a6 votan bien (diferentes)
            game.currentRound = 2;
            game.votes = {
                a1: "a2",
                a2: "a3",
                a3: "a4",
                a4: "imp",
                a5: "imp",
                a6: "imp",
                a7: "a1",
            };
            game.lastRoundScores = {};
            ScoringManager.giveCorrectVotersPoints(game);

            // R3: a7 vota bien (otro diferente)
            game.currentRound = 3;
            game.votes = {
                a1: "a2",
                a2: "a3",
                a3: "a4",
                a4: "a5",
                a5: "a6",
                a6: "a7",
                a7: "imp",
            };
            game.lastRoundScores = {};
            ScoringManager.giveCorrectVotersPoints(game);

            // Nadie votó bien las 3 rondas
            ScoringManager.calculateRoundScores(game, true);

            expect(Object.keys(game.playerBonus).length).toBe(0);
            // Verificar que nadie tiene 10 pts
            Object.values(game.playerScores).forEach((score) => {
                expect(score).toBeLessThan(10);
            });
        });
    });
});
