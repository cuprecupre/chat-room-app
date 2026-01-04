/**
 * Integration tests for Anonymous (Guest) Users
 * Tests that anonymous users work correctly in all game scenarios
 */

const { GameSimulator, createMockUser } = require("./GameSimulator");

/**
 * Create a mock anonymous user (no photoURL, has displayName)
 * Simulates: auth.currentUser after signInAnonymously + updateProfile
 */
function createAnonymousUser(id, displayName) {
    return {
        uid: `anon_${id}_${Date.now()}`,
        name: displayName,
        photoURL: null, // Anonymous users have no photo
        isAnonymous: true,
    };
}

/**
 * Create a mock Google user (has photoURL)
 */
function createGoogleUser(id, name) {
    return {
        uid: `google_${id}_${Date.now()}`,
        name: name,
        photoURL: `https://lh3.googleusercontent.com/a/photo_${id}`,
        isAnonymous: false,
    };
}

describe("Anonymous User Integration", () => {
    let sim;

    beforeEach(() => {
        sim = new GameSimulator();
    });

    describe("Game Creation", () => {
        test("Anonymous user can create a game as host", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            sim.users = [anonHost];
            sim.game = require("../../Game");
            sim.game = new (require("../../Game"))(anonHost, { isRestoring: false });
            sim.game.persist = jest.fn();

            expect(sim.game.hostId).toBe(anonHost.uid);
            expect(sim.game.players.length).toBe(1);
            expect(sim.game.players[0].name).toBe("InvitadoHost");
            expect(sim.game.players[0].photoURL).toBeNull();
        });
    });

    describe("Joining Games", () => {
        test("Anonymous user can join a game hosted by Google user", () => {
            sim.createGame("GoogleHost");
            const anonPlayer = createAnonymousUser("player1", "InvitadoJuan");
            sim.users.push(anonPlayer);
            sim.game.addPlayer(anonPlayer);

            expect(sim.game.players.length).toBe(2);
            const addedPlayer = sim.game.players.find((p) => p.uid === anonPlayer.uid);
            expect(addedPlayer).toBeDefined();
            expect(addedPlayer.name).toBe("InvitadoJuan");
            expect(addedPlayer.photoURL).toBeNull();
        });

        test("Google user can join a game hosted by anonymous user", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            sim.users = [anonHost];
            sim.game = new (require("../../Game"))(anonHost, { isRestoring: false });
            sim.game.persist = jest.fn();

            const googlePlayer = createGoogleUser("player1", "GooglePlayer");
            sim.users.push(googlePlayer);
            sim.game.addPlayer(googlePlayer);

            expect(sim.game.players.length).toBe(2);
            expect(sim.game.hostId).toBe(anonHost.uid);
        });

        test("Multiple anonymous users can be in same game", () => {
            sim.createGame("Host");
            const anon1 = createAnonymousUser("player1", "Invitado1");
            const anon2 = createAnonymousUser("player2", "Invitado2");
            sim.users.push(anon1, anon2);
            sim.game.addPlayer(anon1);
            sim.game.addPlayer(anon2);

            expect(sim.game.players.length).toBe(3);
            // Host created by createGame also has null photoURL
            const playersWithoutPhoto = sim.game.players.filter((p) => p.photoURL === null);
            expect(playersWithoutPhoto.length).toBeGreaterThanOrEqual(2);
        });

        test("Anonymous users with same name have different UIDs", () => {
            sim.createGame("Host");
            const anon1 = createAnonymousUser("p1", "MismoNombre");
            const anon2 = createAnonymousUser("p2", "MismoNombre");
            sim.users.push(anon1, anon2);
            sim.game.addPlayer(anon1);
            sim.game.addPlayer(anon2);

            expect(anon1.uid).not.toBe(anon2.uid);
            expect(sim.game.players.length).toBe(3);
        });
    });

    describe("Gameplay - Anonymous as Impostor", () => {
        test("Anonymous user can be assigned as impostor", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            sim.users = [anonHost];
            sim.game = new (require("../../Game"))(anonHost, { isRestoring: false });
            sim.game.persist = jest.fn();

            sim.addPlayers(["Player2", "Player3"]);
            sim.startGame();

            // Impostor is one of the players
            const impostorId = sim.game.impostorId;
            expect(sim.users.some((u) => u.uid === impostorId)).toBe(true);
        });

        test("Anonymous impostor sees correct state", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]);

            // Force impostor to be the first player (for testing)
            sim.game.startGame(sim.users[0].uid);

            const impostorState = sim.getStateForPlayer(sim.getImpostorIndex());
            expect(impostorState.role).toBe("impostor");
            expect(impostorState.secretWord).toBe("Descubre la palabra secreta");
        });

        test("Anonymous impostor can win by surviving 3 rounds", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            // 3 ties means impostor survives all rounds
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();

            expect(sim.getState().phase).toBe("game_over");
            expect(sim.getState().winnerId).toBe(sim.getState().impostorId);
        });
    });

    describe("Gameplay - Anonymous as Friend", () => {
        test("Anonymous friend sees the secret word", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            const friendState = sim.getStateForPlayer(sim.getNonImpostorIndex());
            expect(friendState.role).toBe("friend");
            expect(friendState.secretWord).not.toBe("Descubre la palabra secreta");
        });

        test("Anonymous friend can vote", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            const friendIndex = sim.getNonImpostorIndex();
            const targetIndex = (friendIndex + 1) % sim.users.length;
            const result = sim.vote(friendIndex, targetIndex);

            expect(result).toBeDefined();
            expect(sim.game.votes[sim.users[friendIndex].uid]).toBe(sim.users[targetIndex].uid);
        });

        test("Anonymous friend can be eliminated", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3", "Player4"]).startGame();

            const targetIndex = sim.getNonImpostorIndex();
            sim.allVoteFor(targetIndex);

            expect(sim.getState().eliminatedPlayers).toContain(sim.users[targetIndex].uid);
        });
    });

    describe("Voting with Mixed Users", () => {
        test("Anonymous and Google users can vote for each other", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            const googlePlayer = createGoogleUser("gp", "GooglePlayer");
            const anonPlayer = createAnonymousUser("ap", "Invitado2");

            sim.users = [anonHost, googlePlayer, anonPlayer];
            sim.game = new (require("../../Game"))(anonHost, { isRestoring: false });
            sim.game.persist = jest.fn();
            sim.game.addPlayer(googlePlayer);
            sim.game.addPlayer(anonPlayer);
            sim.game.startGame(anonHost.uid);

            // Everyone votes for googlePlayer
            sim.vote(0, 1);
            sim.vote(1, 2); // Can't vote for self
            sim.vote(2, 1);

            expect(sim.game.votes[anonHost.uid]).toBe(googlePlayer.uid);
            expect(sim.game.votes[anonPlayer.uid]).toBe(googlePlayer.uid);
        });
    });

    describe("Player State Serialization", () => {
        test("Anonymous player state includes name but no photoURL", () => {
            const anonHost = createAnonymousUser("host", "InvitadoTest");
            sim.users = [anonHost];
            sim.game = new (require("../../Game"))(anonHost, { isRestoring: false });
            sim.game.persist = jest.fn();
            sim.addPlayers(["Player2", "Player3"]);
            sim.startGame();

            const state = sim.getStateForPlayer(0);
            const selfPlayer = state.players.find((p) => p.uid === anonHost.uid);

            expect(selfPlayer.name).toBe("InvitadoTest");
            expect(selfPlayer.photoURL).toBeNull();
        });

        test("Mixed game state shows correct photos for each user type", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            const googlePlayer = createGoogleUser("gp", "GooglePlayer");

            sim.users = [anonHost, googlePlayer];
            sim.game = new (require("../../Game"))(anonHost, { isRestoring: false });
            sim.game.persist = jest.fn();
            sim.game.addPlayer(googlePlayer);

            const state = sim.game.getStateFor(anonHost.uid);

            const anonInState = state.players.find((p) => p.uid === anonHost.uid);
            const googleInState = state.players.find((p) => p.uid === googlePlayer.uid);

            expect(anonInState.photoURL).toBeNull();
            expect(googleInState.photoURL).toContain("googleusercontent");
        });
    });

    describe("Reconnection", () => {
        test("Anonymous user state persists during game", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            const anonPlayer = sim.users[1];

            // Verify player exists and has correct state
            const player = sim.game.players.find((p) => p.uid === anonPlayer.uid);
            expect(player).toBeDefined();
            expect(player.name).toBe("Player2");
            expect(sim.game.roundPlayers).toContain(anonPlayer.uid);
        });
    });

    describe("Game End - Podium", () => {
        test("Anonymous winner has scores in lastRoundScores", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();

            // Make impostor win by surviving 3 rounds
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();

            expect(sim.game.lastRoundScores).toBeDefined();
            expect(Object.keys(sim.game.lastRoundScores).length).toBeGreaterThan(0);
        });

        test("Impostor ID is tracked after game ends", () => {
            sim.createGame("Host").addPlayers(["Player2", "Player3"]).startGame();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();

            // impostorId should still be tracked
            expect(sim.game.impostorId).toBeDefined();
            expect(sim.getState().winnerId).toBe(sim.game.impostorId);
        });
    });
});
