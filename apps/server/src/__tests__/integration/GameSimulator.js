/**
 * GameSimulator - Utility for E2E game testing
 * LOCAL ONLY - Do not commit to repository
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
        const activePlayers = this.game.roundPlayers.filter(
            (uid) => !this.game.eliminatedInRound.includes(uid)
        );
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
        const activePlayers = this.game.roundPlayers.filter(
            (uid) => !this.game.eliminatedInRound.includes(uid)
        );
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
        return {
            phase: this.game.phase,
            currentTurn: this.game.currentTurn,
            roundCount: this.game.roundCount,
            eliminatedInRound: this.game.eliminatedInRound,
            lastEliminatedInTurn: this.game.lastEliminatedInTurn,
            impostorId: this.game.impostorId,
            votes: { ...this.game.votes },
            playerCount: this.game.players.length,
            activePlayerCount: this.game.roundPlayers.filter(
                (uid) => !this.game.eliminatedInRound.includes(uid)
            ).length,
        };
    }

    getStateForPlayer(playerIndex) {
        return this.game.getStateFor(this.users[playerIndex].uid);
    }

    getImpostorIndex() {
        return this.users.findIndex((u) => u.uid === this.game.impostorId);
    }

    getNonImpostorIndex() {
        return this.users.findIndex(
            (u) =>
                u.uid !== this.game.impostorId &&
                this.game.roundPlayers.includes(u.uid) &&
                !this.game.eliminatedInRound.includes(u.uid)
        );
    }

    _captureState(action) {
        this.stateHistory.push({ action, state: this.getState(), timestamp: Date.now() });
    }

    printHistory() {
        console.log("\n=== Game State History ===");
        this.stateHistory.forEach((entry, i) => {
            console.log(`\n[${i}] ${entry.action}`);
            console.log(`    Phase: ${entry.state.phase}, Turn: ${entry.state.currentTurn}`);
        });
    }
}

module.exports = { GameSimulator, createMockUser };
