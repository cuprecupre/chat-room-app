/**
 * Dashboard Page (Private)
 * 
 * User's main dashboard/lobby at route `/app`.
 * Allows creating or joining games.
 */
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { Lobby } from '../../components/Lobby';

export function Dashboard() {
    const { user, gameState, emit } = useOutletContext();
    const navigate = useNavigate();

    // If user is already in a game, redirect to game room
    // BUT skip if user just explicitly left a game (prevents redirect loop)
    useEffect(() => {
        const justLeft = sessionStorage.getItem('justLeftGame');
        if (justLeft) {
            sessionStorage.removeItem('justLeftGame');
            return; // Don't auto-redirect, user just left
        }

        if (gameState?.gameId) {
            navigate(`/app/game/${gameState.gameId}`, { replace: true });
        }
    }, [gameState?.gameId, navigate]);

    // Check for pending game join from invitation
    useEffect(() => {
        const pendingGameId = sessionStorage.getItem('pendingGameId');
        if (pendingGameId) {
            sessionStorage.removeItem('pendingGameId');
            navigate(`/join/${pendingGameId}`);
        }
    }, [navigate]);

    const handleCreateGame = useCallback((options) => {
        emit('create-game', options);
    }, [emit]);

    const handleLogout = useCallback(async () => {
        // Logout is handled by AppLayout
    }, []);

    // Don't render if redirecting to game
    if (gameState?.gameId) {
        return null;
    }

    return (
        <Lobby
            user={user}
            onCreateGame={handleCreateGame}
            onLogout={handleLogout}
        />
    );
}
