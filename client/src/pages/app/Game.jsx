/**
 * Game Page (Private)
 * 
 * Active game room at route `/app/game/:gameId`.
 */
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { useCallback, useMemo, useEffect, useState } from 'react';
import { GameRoom } from '../../components/GameRoom';

export function Game() {
    const { gameId } = useParams();
    const { user, gameState, emit, joinError, clearJoinError } = useOutletContext();
    const navigate = useNavigate();
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    const isMobile = useMemo(() => {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }, []);

    const isHost = useMemo(() => {
        return gameState && user && gameState.hostId === user.uid;
    }, [gameState, user]);

    // If not in a game or wrong game, try to join
    // BUT: Don't auto-rejoin if user just left intentionally
    useEffect(() => {
        // Check if user explicitly left (flag set by leaveGame in App.jsx)
        const justLeft = sessionStorage.getItem('justLeftGame');
        if (justLeft) {
            console.log('[Game.jsx] User just left, not auto-rejoining');
            // Clear the flag immediately after reading it
            sessionStorage.removeItem('justLeftGame');
            // Navigate away if we're stuck on this route
            if (!gameState?.gameId) {
                navigate('/app');
            }
            return;
        }

        if (gameId && !gameState?.gameId && !joinError) {
            console.log(`[Game.jsx] Auto-joining game ${gameId}`);
            emit('join-game', gameId);
        }
    }, [gameId, gameState?.gameId, joinError, emit, navigate]);

    // If left game, redirect to dashboard
    useEffect(() => {
        if (!gameState?.gameId && !joinError) {
            // Not in any game and no error - might be loading
            // Give it a moment before redirecting
        }
    }, [gameState?.gameId, joinError]);

    const startGame = useCallback(() => emit('start-game', gameState?.gameId), [emit, gameState]);
    const endGame = useCallback(() => emit('end-game', gameState?.gameId), [emit, gameState]);
    const playAgain = useCallback(() => emit('play-again', gameState?.gameId), [emit, gameState]);

    const leaveGame = useCallback(() => {
        if (gameState?.gameId) {
            emit('leave-game', gameState.gameId, () => {
                navigate('/app');
            });
            setTimeout(() => navigate('/app'), 2000);
        }
    }, [emit, gameState, navigate]);

    const copyLink = useCallback(async () => {
        if (!gameState?.gameId) return;
        const url = `${window.location.origin}/join/${gameState.gameId}`;

        if (isMobile && navigator.share) {
            try {
                await navigator.share({ title: 'Únete a mi juego de El Impostor', url });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Enlace copiado' }));
        } catch (err) {
            console.error('Error copying:', err);
        }
    }, [gameState, isMobile]);

    const copyGameCode = useCallback(async () => {
        if (!gameState?.gameId) return;

        if (isMobile && navigator.share) {
            try {
                await navigator.share({ title: 'Código de partida', text: `Código: ${gameState.gameId}` });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        try {
            await navigator.clipboard.writeText(gameState.gameId);
            window.dispatchEvent(new CustomEvent('app:toast', { detail: 'Código copiado' }));
        } catch (err) {
            console.error('Error copying:', err);
        }
    }, [gameState, isMobile]);

    const castVote = useCallback((targetId) => {
        if (!gameState?.gameId) return;
        emit('cast-vote', { gameId: gameState.gameId, targetId });
    }, [emit, gameState]);

    // Error state
    if (joinError) {
        return (
            <div className="text-center py-12 space-y-4">
                <h2 className="text-2xl font-serif text-neutral-50">No se pudo unir</h2>
                <p className="text-neutral-400">{joinError}</p>
                <button
                    onClick={() => { clearJoinError(); navigate('/app'); }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    // Loading/joining state
    if (!gameState?.gameId) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-400">Conectando a la partida...</p>
            </div>
        );
    }

    return (
        <GameRoom
            state={gameState}
            isHost={isHost}
            user={user}
            onStartGame={startGame}
            onEndGame={endGame}
            onPlayAgain={playAgain}
            onLeaveGame={leaveGame}
            onCopyLink={copyLink}
            onCopyGameCode={copyGameCode}
            onVote={castVote}
            isMobile={isMobile}
            onOpenInstructions={() => { }}
            showEndGameModal={showEndGameModal}
            onShowEndGameModal={setShowEndGameModal}
        />
    );
}
