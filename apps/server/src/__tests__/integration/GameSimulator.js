/**
 * GameSimulator - Utility for E2E match testing
 * Updated for new Room/Match architecture
 */

const Match = require("../../Match");

function createMockUser(id, name) {
    return { uid: id, name: name, photoURL: null };
}

class GameSimulator {
    constructor() {
        this.match = null;
        this.users = [];
        this.stateHistory = [];
    }

    createMatch(hostName = "Host") {
        const host = createMockUser(`user_${Date.now()}_0`, hostName);
        this.users = [host];
        // Match constructor now takes (host, matchId)
        this.match = new Match(host, `match_${Date.now()}`);
        this.match.persist = jest.fn();
        this._captureState("Match created");
        return this;
    }

    addPlayers(names) {
        names.forEach((name, i) => {
            const user = createMockUser(`user_${Date.now()}_${i + 1}`, name);
            this.users.push(user);
            // Match has addPlayer
            this.match.addPlayer(user);
        });
        this._captureState(`Added ${names.length} players`);
        return this;
    }

    startMatch() {
        this.match.startMatch(this.users[0].uid);
        this._captureState("Match started");
        return this;
    }

    vote(voterIndex, targetIndex) {
        const result = this.match.castVote(this.users[voterIndex].uid, this.users[targetIndex].uid);
        this._captureState(
            `${this.users[voterIndex].name} voted for ${this.users[targetIndex].name}`
        );
        return result;
    }

    allVoteFor(targetIndex) {
        const results = [];
        const eliminated = this.match.eliminatedPlayers || [];
        const activePlayers = this.match.roundPlayers.filter((uid) => !eliminated.includes(uid));
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
        const eliminated = this.match.eliminatedPlayers || [];
        const activePlayers = this.match.roundPlayers.filter((uid) => !eliminated.includes(uid));
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
        const eliminated = this.match.eliminatedPlayers || [];
        return {
            phase: this.match.phase,
            currentRound: this.match.currentRound,
            maxRounds: this.match.maxRounds,
            eliminatedPlayers: eliminated,
            impostorId: this.match.impostorId,
            winnerId: this.match.winnerId,
            votes: { ...this.match.votes },
            playerCount: this.match.players.length,
            playerScores: { ...this.match.playerScores },
            activePlayerCount: this.match.roundPlayers.filter((uid) => !eliminated.includes(uid))
                .length,
        };
    }

    getStateForPlayer(playerIndex) {
        return this.match.getStateFor(this.users[playerIndex].uid);
    }

    getImpostorIndex() {
        return this.users.findIndex((u) => u.uid === this.match.impostorId);
    }

    getNonImpostorIndex() {
        const eliminated = this.match.eliminatedPlayers || [];
        return this.users.findIndex(
            (u) =>
                u.uid !== this.match.impostorId &&
                this.match.roundPlayers.includes(u.uid) &&
                !eliminated.includes(u.uid)
        );
    }

    continueToNextRound() {
        if (this.match.phase === "round_result") {
            this.match.continueToNextRound(this.users[0].uid);
            this._captureState("Continued to next round");
        }
        return this;
    }

    playAgain() {
        // match.playAgain expects userId (host)
        this.match.playAgain(this.users[0].uid);
        this._captureState("Started new match");
        return this;
    }

    _captureState(action) {
        this.stateHistory.push({ action, state: this.getState(), timestamp: Date.now() });
    }

    printHistory() {
        console.log("\n=== Match State History ===");
        this.stateHistory.forEach((entry, i) => {
            console.log(`\n[${i}] ${entry.action}`);
            console.log(`    Phase: ${entry.state.phase}, Round: ${entry.state.currentRound}`);
        });
    }
}

module.exports = { GameSimulator, createMockUser };
