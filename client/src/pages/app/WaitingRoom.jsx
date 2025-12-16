/**
 * Waiting Room Page
 * 
 * Players wait here when trying to join an in-progress game.
 * Automatically joins when the game returns to lobby phase.
 */
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

export function WaitingRoom() {
    const { gameId } = useParams();
    const { user, emit } = useOutletContext();
    const navigate = useNavigate();
    const [waitingPlayers, setWaitingPlayers] = useState([]);
    const [gamePhase, setGamePhase] = useState(null);

    useEffect(() => {
        if (!gameId || !user) return;

        console.log(`[WaitingRoom] Entering waiting room for game ${gameId}`);

        // Emit wait-for-game to server
        emit('wait-for-game', gameId);

        // Listen for waiting room updates
        const handleWaitingRoomUpdate = (data) => {
            console.log('[WaitingRoom] Update received:', data);
            setWaitingPlayers(data.waitingPlayers || []);
            setGamePhase(data.gamePhase);
        };

        // Listen for auto-join
        const handleAutoJoined = (data) => {
            console.log('[WaitingRoom] Auto-joined to game:', data.gameId);
            navigate(`/app/game/${data.gameId}`);
        };

        window.addEventListener('socket:waiting-room-updated', (e) => handleWaitingRoomUpdate(e.detail));
        window.addEventListener('socket:auto-joined', (e) => handleAutoJoined(e.detail));

        return () => {
            window.removeEventListener('socket:waiting-room-updated', handleWaitingRoomUpdate);
            window.removeEventListener('socket:auto-joined', handleAutoJoined);
        };
    }, [gameId, user, emit, navigate]);

    const handleCancel = () => {
        emit('leave-waiting-room', gameId);
        navigate('/app');
    };

    return (
        <div className="min-h-[100dvh] bg-neutral-950 text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center">
                        <span className="text-5xl">⏳</span>
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-serif text-neutral-50">Esperando...</h1>
                    <p className="text-neutral-400">
                        La partida está en curso. Serás añadido automáticamente cuando termine.
                    </p>
                </div>

                {/* Game Code */}
                <div className="bg-neutral-900 rounded-lg p-4">
                    <p className="text-sm text-neutral-500 mb-1">Código de partida</p>
                    <p className="text-2xl font-bold text-orange-400">{gameId}</p>
                </div>

                {/* Waiting Players List */}
                {waitingPlayers.length > 0 && (
                    <div className="bg-neutral-900 rounded-lg p-4 space-y-3">
                        <p className="text-sm text-neutral-500">
                            {waitingPlayers.length} {waitingPlayers.length === 1 ? 'jugador esperando' : 'jugadores esperando'}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {waitingPlayers.map((player) => (
                                <div key={player.uid} className="flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-2">
                                    <Avatar
                                        name={player.name}
                                        photoURL={player.photoURL}
                                        size="sm"
                                    />
                                    <span className="text-sm text-neutral-300">{player.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Phase Info */}
                {gamePhase && (
                    <p className="text-xs text-neutral-600">
                        Estado: {gamePhase === 'playing' ? '🎮 Jugando' : '⏸ En lobby'}
                    </p>
                )}

                {/* Cancel Button */}
                <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="lg"
                >
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
