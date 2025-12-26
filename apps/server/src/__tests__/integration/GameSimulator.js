/**
 * GameSimulator - Utility for E2E game testing
 * Updated for new scoring system (no turns, 3 rounds, same impostor)
 */

const Game = require("../../Game");

function createMockUser(id, name) {
    return { uid: id, name: name, photoURL: null };
}

class GameSimulator {
    constructor() {
        this.game = null;
        this.users = [];
        this.stateHistory = [];
    }

    createGame(hostName = "Host") {
        const host = createMockUser(`user_${Date.now()}_0`, hostName);
        this.users = [host];
        this.game = new Game(host, { isRestoring: false });
        this.game.persist = jest.fn();
        this._captureState("Game created");
        return this;
    }

    addPlayers(names) {
        names.forEach((name, i) => {
            const user = createMockUser(`user_${Date.now()}_${i + 1}`, name);
            this.users.push(user);
            this.game.addPlayer(user);
        });
        this._captureState(`Added ${names.length} players`);
        return this;
    }

    startGame() {
        this.game.startGame(this.users[0].uid);
        this._captureState("Game started");
        return this;
    }

    vote(voterIndex, targetIndex) {
        const result = this.game.castVote(this.users[voterIndex].uid, this.users[targetIndex].uid);
        this._captureState(
            `${this.users[voterIndex].name} voted for ${this.users[targetIndex].name}`
        );
        return result;
    }

    allVoteFor(targetIndex) {
        const results = [];
        const eliminated = this.game.eliminatedPlayers || [];
        const activePlayers = this.game.roundPlayers.filter((uid) => !eliminated.includes(uid));
        activePlayers.forEach((uid) => {
            const voterIndex = this.users.findIndex((u) => u.uid === uid);
            if (uid !== this.users[targetIndex].uid) {
                results.push(this.vote(voterIndex, targetIndex));
            } else {
                const otherIndex = (targetIndex + 1) % this.users.length;
                if (activePlayers.includes(this.users[otherIndex].uid)) {
                    results.push(this.vote(voterIndex, otherIndex));
                }
            }
        });
        return results;
    }

    createTieVote() {
        const eliminated = this.game.eliminatedPlayers || [];
        const activePlayers = this.game.roundPlayers.filter((uid) => !eliminated.includes(uid));
        const results = [];
        activePlayers.forEach((uid, i) => {
            const voterIndex = this.users.findIndex((u) => u.uid === uid);
            const nextPlayerUid = activePlayers[(i + 1) % activePlayers.length];
            const targetIndex = this.users.findIndex((u) => u.uid === nextPlayerUid);
            results.push(this.vote(voterIndex, targetIndex));
        });
        return results;
    }

    getState() {
        const eliminated = this.game.eliminatedPlayers || [];
        return {
            phase: this.game.phase,
            currentRound: this.game.currentRound,
            maxRounds: this.game.maxRounds,
            eliminatedPlayers: eliminated,
            impostorId: this.game.impostorId,
            winnerId: this.game.winnerId,
            votes: { ...this.game.votes },
            playerCount: this.game.players.length,
            playerScores: { ...this.game.playerScores },
            activePlayerCount: this.game.roundPlayers.filter((uid) => !eliminated.includes(uid))
                .length,
        };
    }

    getStateForPlayer(playerIndex) {
        return this.game.getStateFor(this.users[playerIndex].uid);
    }

    getImpostorIndex() {
        return this.users.findIndex((u) => u.uid === this.game.impostorId);
    }

    getNonImpostorIndex() {
        const eliminated = this.game.eliminatedPlayers || [];
        return this.users.findIndex(
            (u) =>
                u.uid !== this.game.impostorId &&
                this.game.roundPlayers.includes(u.uid) &&
                !eliminated.includes(u.uid)
        );
    }

    continueToNextRound() {
        if (this.game.phase === "round_result") {
            this.game.continueToNextRound();
            this._captureState("Continued to next round");
        }
        return this;
    }

    playAgain() {
        this.game.playAgain(this.users[0].uid);
        this._captureState("Started new match");
        return this;
    }

    _captureState(action) {
        this.stateHistory.push({ action, state: this.getState(), timestamp: Date.now() });
    }

    printHistory() {
        console.log("\n=== Game State History ===");
        this.stateHistory.forEach((entry, i) => {
            console.log(`\n[${i}] ${entry.action}`);
            console.log(`    Phase: ${entry.state.phase}, Round: ${entry.state.currentRound}`);
        });
    }
}

module.exports = { GameSimulator, createMockUser };
