/**
 * GameStateSerializer
 *
 * Provides serialization functions for game state:
 * - getStateForPlayer: Personalized state for each player (for real-time updates)
 * - getEnrichedGameData: Full match data for persistence
 */

// Role and message translations
// Role and message keys (Client will translate)
const KEYS = {
    IMPOSTOR: 'impostor',
    FRIEND: 'friend',
    SECRET_WORD_HINT: 'SECRET_WORD_HINT',
    DISCONNECTED_PLAYER: 'DISCONNECTED_PLAYER',
};

function getStateForPlayer(match, userId) {
    const player = match.players.find((p) => p.uid === userId);
    if (!player) return null;

    const eliminated = match.eliminatedPlayers || [];

    const baseState = {
        matchId: match.matchId,
        gameId: match.matchId, // For legacy client compatibility
        roomId: match.roomId,
        hostId: match.hostId,
        players: match.players,
        phase: match.phase,
        playerScores: match.playerScores,
        currentRound: match.currentRound,
        maxRounds: match.maxRounds,
        playerOrder: match.playerOrder,
        startingPlayerId: match.startingPlayerId,
        gameMode: match.gameMode || 'voice', // 'voice' | 'chat'
    };

    // Chat Mode: clue_round phase
    if (match.phase === "clue_round" && match.chatModeManager) {
        const isInRound = match.roundPlayers.includes(userId);
        const isEliminated = eliminated.includes(userId);

        if (!isInRound && !isEliminated) {
            baseState.phase = "lobby_wait";
        } else {
            const isImpostor = match.impostorId === userId;
            baseState.role = isImpostor ? KEYS.IMPOSTOR : KEYS.FRIEND;
            baseState.secretWord = isImpostor
                ? KEYS.SECRET_WORD_HINT
                : match.secretWord;
            if (isImpostor && match.showImpostorHint) {
                baseState.secretCategory = match.secretCategory;
                baseState.secretWordTranslations = {
                    es: { category: match.secretWordTranslations?.es?.category },
                    en: { category: match.secretWordTranslations?.en?.category }
                };
            } else if (!isImpostor) {
                baseState.secretWordTranslations = match.secretWordTranslations;
            }

            // Chat mode specific state
            const chatState = match.chatModeManager.getState();
            baseState.chatMode = {
                currentTurnPlayerId: chatState.currentTurnPlayerId,
                currentTurnIndex: chatState.currentTurnIndex,
                revealedClues: chatState.revealedClues,
                submittedPlayerIds: chatState.submittedPlayerIds,
                revealedPlayerIds: chatState.revealedPlayerIds,
                turnStartedAt: chatState.turnStartedAt,
                timeoutMs: chatState.timeoutMs,
                hasSubmitted: match.chatModeManager.hasSubmitted(userId),
            };
            baseState.activePlayers = match.roundPlayers.filter((uid) => !eliminated.includes(uid));
            baseState.eliminatedPlayers = eliminated;
        }
    } else if (match.phase === "playing") {
        const isInRound = match.roundPlayers.includes(userId);
        const isEliminated = eliminated.includes(userId);

        if (!isInRound && !isEliminated) {
            // Player never was part of this round (late joiner)
            baseState.phase = "lobby_wait";
        } else {
            // Player is active or eliminated - keep in playing phase
            // const lang = match.language || 'es'; // Deprecated server-side translation
            const isImpostor = match.impostorId === userId;
            baseState.role = isImpostor ? KEYS.IMPOSTOR : KEYS.FRIEND;
            baseState.secretWord = isImpostor
                ? KEYS.SECRET_WORD_HINT
                : match.secretWord;
            if (isImpostor && match.showImpostorHint) {
                baseState.secretCategory = match.secretCategory;
                // Send ONLY categories to impostor to prevent leaking the word
                baseState.secretWordTranslations = {
                    es: { category: match.secretWordTranslations?.es?.category },
                    en: { category: match.secretWordTranslations?.en?.category }
                };
            } else if (!isImpostor) {
                // Friends get everything
                baseState.secretWordTranslations = match.secretWordTranslations;
            }

            // Info de votación
            baseState.eliminatedPlayers = eliminated;
            baseState.hasVoted = match.votes.hasOwnProperty(userId);
            baseState.votedPlayers = Object.keys(match.votes);
            baseState.myVote = match.votes[userId] || null;
            baseState.activePlayers = match.roundPlayers.filter((uid) => !eliminated.includes(uid));
            baseState.canVote = !isEliminated;
            baseState.roundHistory = match.roundHistory;

            // Include revealed clues if in chat mode (for voting screen)
            if (match.gameMode === 'chat' && match.chatModeManager) {
                baseState.chatMode = {
                    revealedClues: match.chatModeManager.getAllRevealedClues(),
                };
            }
        }
    } else if (match.phase === "round_result" || match.phase === "game_over") {
        // const lang = match.language || 'es';
        const impostor = match.players.find((p) => p.uid === match.impostorId);
        const formerImpostor = match.formerPlayers[match.impostorId];
        baseState.impostorName = impostor
            ? impostor.name
            : formerImpostor
                ? formerImpostor.name
                : KEYS.DISCONNECTED_PLAYER;
        baseState.impostorId = match.impostorId;
        baseState.secretWord = match.secretWord;
        baseState.lastRoundScores = match.lastRoundScores;
        baseState.eliminatedPlayers = eliminated;
        baseState.eliminatedPlayers = eliminated;
        baseState.formerPlayers = match.formerPlayers;
        baseState.playerBonus = match.playerBonus || {};
        baseState.secretWordTranslations = match.secretWordTranslations;
        baseState.roundHistory = match.roundHistory;

        // NEW: include winner info if available (match ended but showing result)
        if (match.winnerId) {
            const winnerId = match.winnerId;
            const winner = match.players.find((p) => p.uid === winnerId);
            const formerWinner = match.formerPlayers[winnerId];
            baseState.winner = winner ? winner.name : formerWinner ? formerWinner.name : "Empate";
            baseState.winnerId = winnerId;
            baseState.impostorWon = winnerId === match.impostorId;
        }

        if (match.phase === "game_over") {
            // Usar winnerId directamente (ya calculado en endRound)
            const winnerId = match.winnerId;
            const winner = match.players.find((p) => p.uid === winnerId);
            const formerWinner = match.formerPlayers[winnerId];
            baseState.winner = winner ? winner.name : formerWinner ? formerWinner.name : "Empate";
            baseState.winnerId = winnerId;
            baseState.impostorWon = winnerId === match.impostorId;
        }
    } else if (match.phase === "host_cancelled") {
        // Host left the match - no winner, no scores
        baseState.hostCancelled = true;
        baseState.winnerId = null;
        baseState.winner = null;
    }

    // Always include formerPlayers for showing scores
    baseState.formerPlayers = match.formerPlayers;

    // DIAGNOSTIC: Detect bloated state
    try {
        const jsonStr = JSON.stringify(baseState);
        if (jsonStr.length > 50000) {
            console.warn(
                `[GameStateSerializer] ⚠️ LARGE STATE DETECTED: ${(jsonStr.length / 1024).toFixed(2)} KB`
            );
        }
    } catch (e) {
        console.error("[GameStateSerializer] Error analyzing state size:", e);
    }

    return baseState;
}

/**
 * Returns enriched match data for full persistence in /matches collection.
 */
function getEnrichedGameData(match) {
    // Collect all participants (current + former)
    const participantIds = new Set([
        ...match.players.map(p => p.uid),
        ...Object.keys(match.formerPlayers || {}).filter(uid => match.playerScores?.hasOwnProperty(uid))
    ]);

    const playersInfo = Array.from(participantIds).map((uid) => {
        const p = match.players.find((pp) => pp.uid === uid) || {
            uid,
            ...match.formerPlayers[uid]
        };
        const isImpostor = match.impostorId === uid;
        const eliminated = match.eliminatedPlayers || [];
        const hasAbandoned = !match.players.some(pp => pp.uid === uid);

        return {
            uid: uid,
            name: p.name,
            role: isImpostor ? "impostor" : "friend",
            score: match.playerScores[uid] || 0,
            wasEliminated: eliminated.includes(uid),
            abandoned: hasAbandoned
        };
    });

    // Determine winning team
    const impostorWon = match.winnerId === match.impostorId;
    const winningTeam = match.winnerId === null
        ? "cancelled"  // Match ended manually without a winner
        : match.winnerId === "tie"
            ? "tie"
            : impostorWon ? "impostor" : "friends";

    return {
        matchId: match.matchId,
        roomId: match.roomId,
        gameMode: match.gameMode || 'voice',
        impostorId: match.impostorId,
        winnerId: match.winnerId || null,
        winningTeam,
        roundCount: match.currentRound,
        playerCount: playersInfo.length, // Total players (including abandoned)
        players: playersInfo,
        rounds: match.roundHistory || [],
        startedAt: match.startedAt || null,
        endedAt: Date.now(),
        options: match.options || {},
    };
}

module.exports = {
    getStateForPlayer,
    getEnrichedGameData,
};
