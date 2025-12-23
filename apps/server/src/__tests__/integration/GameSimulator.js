/**
 * GameSimulator - Utility for E2E game testing
 * 
 * Simulates multiple users playing a game without actual Socket.IO connections.
 * Directly uses the Game class and managers to test game flows.
 */

const Game = require('../../Game');
const VotingManager = require('../../game/VotingManager');

/**
 * Creates a mock user object
 */
function createMockUser(id, name) {
    return {
        uid: id,
        name: name,
        photoURL: null
    };
}

/**
 * GameSimulator class for testing complete game flows
 */
class GameSimulator {
    constructor() {
        this.game = null;
        this.users = [];
        this.stateHistory = [];
    }

    /**
     * Create a new game with a host
     */
    createGame(hostName = 'Host') {
        const host = createMockUser(`user_${Date.now()}_0`, hostName);
        this.users = [host];
        this.game = new Game(host, { isRestoring: false });
        // Disable actual persistence
        this.game.persist = jest.fn();
        this._captureState('Game created');
        return this;
    }

    /**
     * Add players to the game
     */
    addPlayers(names) {
        names.forEach((name, i) => {
            const user = createMockUser(`user_${Date.now()}_${i + 1}`, name);
            this.users.push(user);
            this.game.addPlayer(user);
        });
        this._captureState(`Added ${names.length} players`);
        return this;
    }

    /**
     * Start the game
     */
    startGame() {
        const hostId = this.users[0].uid;
        this.game.startGame(hostId);
        this._captureState('Game started');
        return this;
    }

    /**
     * Cast a vote from a player
     * @param {number} voterIndex - Index of the voter in users array
     * @param {number} targetIndex - Index of the target in users array
     * @returns {{ phaseChanged: boolean, allVoted: boolean }}
     */
    vote(voterIndex, targetIndex) {
        const voterId = this.users[voterIndex].uid;
        const targetId = this.users[targetIndex].uid;
        const result = this.game.castVote(voterId, targetId);
        this._captureState(`${this.users[voterIndex].name} voted for ${this.users[targetIndex].name}`);
        return result;
    }

    /**
     * Make all players vote for a specific target
     * @param {number} targetIndex - Index of the target
     * @returns {Array} Results of each vote
     */
    allVoteFor(targetIndex) {
        const results = [];
        const activePlayers = this.game.roundPlayers.filter(
            uid => !this.game.eliminatedInRound.includes(uid)
        );

        activePlayers.forEach(uid => {
            const voterIndex = this.users.findIndex(u => u.uid === uid);
            if (uid !== this.users[targetIndex].uid) {
                results.push(this.vote(voterIndex, targetIndex));
            } else {
                // Can't vote for self, vote for someone else
                const otherIndex = (targetIndex + 1) % this.users.length;
                if (activePlayers.includes(this.users[otherIndex].uid)) {
                    results.push(this.vote(voterIndex, otherIndex));
                }
            }
        });

        return results;
    }

    /**
     * Create a tie vote (everyone votes differently)
     */
    createTieVote() {
        const activePlayers = this.game.roundPlayers.filter(
            uid => !this.game.eliminatedInRound.includes(uid)
        );

        const results = [];
        activePlayers.forEach((uid, i) => {
            const voterIndex = this.users.findIndex(u => u.uid === uid);
            // Vote for next player (circular)
            const nextPlayerUid = activePlayers[(i + 1) % activePlayers.length];
            const targetIndex = this.users.findIndex(u => u.uid === nextPlayerUid);
            results.push(this.vote(voterIndex, targetIndex));
        });

        return results;
    }

    /**
     * Get current game state
     */
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
                uid => !this.game.eliminatedInRound.includes(uid)
            ).length
        };
    }

    /**
     * Get state for a specific player (as they would receive it)
     */
    getStateForPlayer(playerIndex) {
        return this.game.getStateFor(this.users[playerIndex].uid);
    }

    /**
     * Find the impostor's index in users array
     */
    getImpostorIndex() {
        return this.users.findIndex(u => u.uid === this.game.impostorId);
    }

    /**
     * Find a non-impostor player index
     */
    getNonImpostorIndex() {
        return this.users.findIndex(u =>
            u.uid !== this.game.impostorId &&
            this.game.roundPlayers.includes(u.uid) &&
            !this.game.eliminatedInRound.includes(u.uid)
        );
    }

    /**
     * Capture state for debugging
     */
    _captureState(action) {
        this.stateHistory.push({
            action,
            state: this.getState(),
            timestamp: Date.now()
        });
    }

    /**
     * Print state history for debugging
     */
    printHistory() {
        console.log('\n=== Game State History ===');
        this.stateHistory.forEach((entry, i) => {
            console.log(`\n[${i}] ${entry.action}`);
            console.log(`    Phase: ${entry.state.phase}, Turn: ${entry.state.currentTurn}`);
            console.log(`    Active Players: ${entry.state.activePlayerCount}`);
            console.log(`    Last Eliminated: ${entry.state.lastEliminatedInTurn}`);
        });
    }
}

module.exports = { GameSimulator, createMockUser };
