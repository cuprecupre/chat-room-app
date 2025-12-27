import React, { useState } from 'react';
import { RoundStartOverlay } from '../components/RoundStartOverlay';
import { RoundResultOverlay } from '../components/RoundResultOverlay';
import { GameOverScreen } from '../components/GameOverScreen';

export default function DebugPreviews() {
    const [view, setView] = useState('menu');

    // Mock User
    const currentUser = { uid: 'user1', name: 'Developer', photoURL: null };
    const guestUser = { uid: 'user2', name: 'Alice', photoURL: null };

    // Mock Players
    const players = [
        { uid: 'user1', name: 'Developer', photoURL: null },
        { uid: 'user2', name: 'Alice', photoURL: null },
        { uid: 'user3', name: 'Bob', photoURL: null },
        { uid: 'user4', name: 'Charlie', photoURL: null },
    ];

    // Mocks for States
    const mockStateCommon = {
        players,
        currentRound: 1,
        phase: 'playing',
        impostorId: 'user4',
        secretWord: 'Banana',
        startingPlayerId: 'user1',
        roundCount: 1,
    };

    // Result: Eliminated
    const mockStateResultElim = {
        ...mockStateCommon,
        phase: 'round_result',
        roundHistory: [{ tie: false, eliminated: 'user3', votes: { 'user1': 'user3', 'user2': 'user3', 'user4': 'user3' } }],
        lastRoundScores: { 'user1': 100 }
    };

    // Result: Tie
    const mockStateResultTie = {
        ...mockStateCommon,
        phase: 'round_result',
        roundHistory: [{ tie: true, eliminated: null, votes: { 'user1': 'user2', 'user2': 'user3' } }],
        lastRoundScores: { 'user1': 50 }
    };

    // Game Over: Amigo gana (Host view)
    const mockStateGameOverFriendWins = {
        ...mockStateCommon,
        phase: 'game_over',
        winner: 'Developer',
        winnerId: 'user1',
        impostorId: 'user4',
        playerScores: { 'user1': 500, 'user2': 300, 'user3': 100, 'user4': 450 },
    };

    // Game Over: Impostor gana (Host view)
    const mockStateGameOverImpostorWins = {
        ...mockStateCommon,
        phase: 'game_over',
        winner: 'Charlie',
        winnerId: 'user4', // Charlie es el impostor y ganó
        impostorId: 'user4',
        playerScores: { 'user4': 600, 'user1': 400, 'user2': 300, 'user3': 100 },
    };

    // Game Over: Empate
    const mockStateGameOverTie = {
        ...mockStateCommon,
        phase: 'game_over',
        winner: 'Empate',
        winnerId: null,
        impostorId: 'user4',
        playerScores: { 'user1': 400, 'user2': 400, 'user3': 400, 'user4': 300 },
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 relative overflow-hidden">

            {/* Controls */}
            <div className="relative z-[100] flex flex-wrap gap-2 mb-8 justify-center">
                {/* Rondas */}
                <div className="flex gap-2">
                    <button onClick={() => setView('r1')} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm">Ronda 1</button>
                    <button onClick={() => setView('r2')} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm">Ronda 2</button>
                    <button onClick={() => setView('r3')} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm">Ronda 3</button>
                </div>
                {/* Resultados */}
                <div className="flex gap-2">
                    <button onClick={() => setView('result_elim_host')} className="px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded text-sm">Eliminado (Host)</button>
                    <button onClick={() => setView('result_elim_guest')} className="px-3 py-2 bg-blue-900/60 hover:bg-blue-800/60 rounded text-sm">Eliminado (Guest)</button>
                    <button onClick={() => setView('result_tie_host')} className="px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded text-sm">Empate (Host)</button>
                    <button onClick={() => setView('result_tie_guest')} className="px-3 py-2 bg-blue-900/60 hover:bg-blue-800/60 rounded text-sm">Empate (Guest)</button>
                </div>
                {/* Game Over */}
                <div className="flex gap-2">
                    <button onClick={() => setView('gameover_friend_host')} className="px-3 py-2 bg-green-900 hover:bg-green-800 rounded text-sm">Amigo Gana (Host)</button>
                    <button onClick={() => setView('gameover_friend_guest')} className="px-3 py-2 bg-green-900/60 hover:bg-green-800/60 rounded text-sm">Amigo Gana (Guest)</button>
                    <button onClick={() => setView('gameover_impostor_host')} className="px-3 py-2 bg-orange-900 hover:bg-orange-800 rounded text-sm">Impostor Gana (Host)</button>
                    <button onClick={() => setView('gameover_impostor_guest')} className="px-3 py-2 bg-orange-900/60 hover:bg-orange-800/60 rounded text-sm">Impostor Gana (Guest)</button>
                    <button onClick={() => setView('gameover_tie')} className="px-3 py-2 bg-purple-900 hover:bg-purple-800 rounded text-sm">Empate Final</button>
                </div>
                <button onClick={() => window.location.reload()} className="px-3 py-2 bg-red-900/50 hover:bg-red-900/70 rounded text-sm">Reset</button>
            </div>

            {/* Previews: Rondas */}
            {view === 'r1' && <RoundStartOverlay state={{ ...mockStateCommon, phase: 'playing', currentRound: 1 }} />}
            {view === 'r2' && <RoundStartOverlay state={{ ...mockStateCommon, phase: 'playing', currentRound: 2 }} />}
            {view === 'r3' && <RoundStartOverlay state={{ ...mockStateCommon, phase: 'playing', currentRound: 3 }} />}

            {/* Previews: Result Eliminated */}
            {view === 'result_elim_host' && (
                <RoundResultOverlay state={mockStateResultElim} isHost={true} onNextRound={() => alert('Next Round')} currentUserId={currentUser.uid} />
            )}
            {view === 'result_elim_guest' && (
                <RoundResultOverlay state={mockStateResultElim} isHost={false} onNextRound={() => { }} currentUserId={guestUser.uid} />
            )}

            {/* Previews: Result Tie */}
            {view === 'result_tie_host' && (
                <RoundResultOverlay state={mockStateResultTie} isHost={true} onNextRound={() => alert('Next Round')} currentUserId={currentUser.uid} />
            )}
            {view === 'result_tie_guest' && (
                <RoundResultOverlay state={mockStateResultTie} isHost={false} onNextRound={() => { }} currentUserId={guestUser.uid} />
            )}

            {/* Previews: Game Over - Amigo Gana */}
            {view === 'gameover_friend_host' && (
                <GameOverScreen state={mockStateGameOverFriendWins} isHost={true} onPlayAgain={() => alert('Play Again')} user={currentUser} />
            )}
            {view === 'gameover_friend_guest' && (
                <GameOverScreen state={mockStateGameOverFriendWins} isHost={false} onPlayAgain={() => { }} user={guestUser} />
            )}

            {/* Previews: Game Over - Impostor Gana */}
            {view === 'gameover_impostor_host' && (
                <GameOverScreen state={mockStateGameOverImpostorWins} isHost={true} onPlayAgain={() => alert('Play Again')} user={currentUser} />
            )}
            {view === 'gameover_impostor_guest' && (
                <GameOverScreen state={mockStateGameOverImpostorWins} isHost={false} onPlayAgain={() => { }} user={guestUser} />
            )}

            {/* Previews: Game Over - Empate */}
            {view === 'gameover_tie' && (
                <GameOverScreen state={mockStateGameOverTie} isHost={true} onPlayAgain={() => alert('Play Again')} user={currentUser} />
            )}
        </div>
    );
}
