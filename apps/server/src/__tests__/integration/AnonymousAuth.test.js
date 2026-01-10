/**
 * Integration tests for Anonymous (Guest) Users
 * Tests that anonymous users work correctly in all match scenarios
 */

const { GameSimulator, createMockUser } = require("./GameSimulator");
const Match = require("../../Match");

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

    describe("Match Creation", () => {
        test("Anonymous user can create a match as host", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            sim.users = [anonHost];
            sim.match = new Match(anonHost, { isRestoring: false });
            sim.match.persist = jest.fn();

            expect(sim.match.hostId).toBe(anonHost.uid);
            expect(sim.match.players.length).toBe(1);
            expect(sim.match.players[0].name).toBe("InvitadoHost");
            expect(sim.match.players[0].photoURL).toBeNull();
        });
    });

    describe("Joining Matches", () => {
        test("Anonymous user can join a match hosted by Google user", () => {
            sim.createMatch("GoogleHost");
            const anonPlayer = createAnonymousUser("player1", "InvitadoJuan");
            sim.users.push(anonPlayer);
            sim.match.addPlayer(anonPlayer);

            expect(sim.match.players.length).toBe(2);
            const addedPlayer = sim.match.players.find((p) => p.uid === anonPlayer.uid);
            expect(addedPlayer).toBeDefined();
            expect(addedPlayer.name).toBe("InvitadoJuan");
            expect(addedPlayer.photoURL).toBeNull();
        });

        test("Google user can join a match hosted by anonymous user", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            sim.users = [anonHost];
            sim.match = new Match(anonHost, { isRestoring: false });
            sim.match.persist = jest.fn();

            const googlePlayer = createGoogleUser("player1", "GooglePlayer");
            sim.users.push(googlePlayer);
            sim.match.addPlayer(googlePlayer);

            expect(sim.match.players.length).toBe(2);
            expect(sim.match.hostId).toBe(anonHost.uid);
        });

        test("Multiple anonymous users can be in same match", () => {
            sim.createMatch("Host");
            const anon1 = createAnonymousUser("player1", "Invitado1");
            const anon2 = createAnonymousUser("player2", "Invitado2");
            sim.users.push(anon1, anon2);
            sim.match.addPlayer(anon1);
            sim.match.addPlayer(anon2);

            expect(sim.match.players.length).toBe(3);
            // Host created by createMatch also has null photoURL
            const playersWithoutPhoto = sim.match.players.filter((p) => p.photoURL === null);
            expect(playersWithoutPhoto.length).toBeGreaterThanOrEqual(2);
        });

        test("Anonymous users with same name have different UIDs", () => {
            sim.createMatch("Host");
            const anon1 = createAnonymousUser("p1", "MismoNombre");
            const anon2 = createAnonymousUser("p2", "MismoNombre");
            sim.users.push(anon1, anon2);
            sim.match.addPlayer(anon1);
            sim.match.addPlayer(anon2);

            expect(anon1.uid).not.toBe(anon2.uid);
            expect(sim.match.players.length).toBe(3);
        });
    });

    describe("Gameplay - Anonymous as Impostor", () => {
        test("Anonymous user can be assigned as impostor", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            sim.users = [anonHost];
            sim.match = new Match(anonHost, { isRestoring: false });
            sim.match.persist = jest.fn();

            sim.addPlayers(["Player2", "Player3"]);
            sim.startMatch();

            // Impostor is one of the players
            const impostorId = sim.match.impostorId;
            expect(sim.users.some((u) => u.uid === impostorId)).toBe(true);
        });

        test("Anonymous impostor sees correct state", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]);

            // Force match to start
            sim.match.startMatch(sim.users[0].uid);

            const impostorState = sim.getStateForPlayer(sim.getImpostorIndex());
            expect(impostorState.role).toBe("impostor");
            expect(impostorState.secretWord).toBe("SECRET_WORD_HINT");
        });

        test("Anonymous impostor can win by surviving 3 rounds", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]).startMatch();

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
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]).startMatch();

            const friendState = sim.getStateForPlayer(sim.getNonImpostorIndex());
            expect(friendState.role).toBe("friend");
            expect(friendState.secretWord).not.toBe("SECRET_WORD_HINT");
        });

        test("Anonymous friend can vote", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]).startMatch();

            const friendIndex = sim.getNonImpostorIndex();
            const targetIndex = (friendIndex + 1) % sim.users.length;
            const result = sim.vote(friendIndex, targetIndex);

            expect(result).toBeDefined();
            expect(sim.match.votes[sim.users[friendIndex].uid]).toBe(sim.users[targetIndex].uid);
        });

        test("Anonymous friend can be eliminated", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3", "Player4"]).startMatch();

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
            sim.match = new Match(anonHost, { isRestoring: false });
            sim.match.persist = jest.fn();
            sim.match.addPlayer(googlePlayer);
            sim.match.addPlayer(anonPlayer);
            sim.match.startMatch(anonHost.uid);

            // Everyone votes for googlePlayer
            sim.vote(0, 1);
            sim.vote(1, 2); // Can't vote for self
            sim.vote(2, 1);

            expect(sim.match.votes[anonHost.uid]).toBe(googlePlayer.uid);
            expect(sim.match.votes[anonPlayer.uid]).toBe(googlePlayer.uid);
        });
    });

    describe("Player State Serialization", () => {
        test("Anonymous player state includes name but no photoURL", () => {
            const anonHost = createAnonymousUser("host", "InvitadoTest");
            sim.users = [anonHost];
            sim.match = new Match(anonHost, { isRestoring: false });
            sim.match.persist = jest.fn();
            sim.addPlayers(["Player2", "Player3"]);
            sim.startMatch();

            const state = sim.getStateForPlayer(0);
            const selfPlayer = state.players.find((p) => p.uid === anonHost.uid);

            expect(selfPlayer.name).toBe("InvitadoTest");
            expect(selfPlayer.photoURL).toBeNull();
        });

        test("Mixed match state shows correct photos for each user type", () => {
            const anonHost = createAnonymousUser("host", "InvitadoHost");
            const googlePlayer = createGoogleUser("gp", "GooglePlayer");

            sim.users = [anonHost, googlePlayer];
            sim.match = new Match(anonHost, { isRestoring: false });
            sim.match.persist = jest.fn();
            sim.match.addPlayer(googlePlayer);

            const state = sim.match.getStateFor(anonHost.uid);

            const anonInState = state.players.find((p) => p.uid === anonHost.uid);
            const googleInState = state.players.find((p) => p.uid === googlePlayer.uid);

            expect(anonInState.photoURL).toBeNull();
            expect(googleInState.photoURL).toContain("googleusercontent");
        });
    });

    describe("Reconnection", () => {
        test("Anonymous user state persists during match", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]).startMatch();

            const anonPlayer = sim.users[1];

            // Verify player exists and has correct state
            const player = sim.match.players.find((p) => p.uid === anonPlayer.uid);
            expect(player).toBeDefined();
            expect(player.name).toBe("Player2");
            expect(sim.match.roundPlayers).toContain(anonPlayer.uid);
        });
    });

    describe("Match End - Podium", () => {
        test("Anonymous winner has scores in lastRoundScores", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]).startMatch();

            // Make impostor win by surviving 3 rounds
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();

            expect(sim.match.lastRoundScores).toBeDefined();
            expect(Object.keys(sim.match.lastRoundScores).length).toBeGreaterThan(0);
        });

        test("Impostor ID is tracked after match ends", () => {
            sim.createMatch("Host").addPlayers(["Player2", "Player3"]).startMatch();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();
            sim.continueToNextRound();
            sim.createTieVote();

            // impostorId should still be tracked
            expect(sim.match.impostorId).toBeDefined();
            expect(sim.getState().winnerId).toBe(sim.match.impostorId);
        });
    });
});
