/**
 * Invitation Page (Public)
 * 
 * Displays game invitation at route `/join/:gameId`.
 * Shows login options if unauthenticated, auto-joins if authenticated.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import { LandingPage } from '../../components/LandingPage';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import bellImg from '../../assets/bell.png';

export function Invitation() {
    const { gameId } = useParams();
    const { user, loading: authLoading, login } = useAuth();
    const { connected, gameState, emit, joinError, clearJoinError } = useSocket(user);
    const navigate = useNavigate();
    const [hostName, setHostName] = useState(null);
    const [joiningAttempted, setJoiningAttempted] = useState(false);

    // Confirm Switch Modal State
    const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

    // Fetch game preview info
    useEffect(() => {
        if (!gameId) return;

        const controller = new AbortController();
        const fetchPreview = async () => {
            try {
                const apiBase = import.meta.env.MODE === 'production'
                    ? window.location.origin
                    : `${window.location.protocol}//${window.location.hostname}:3000`;

                const res = await fetch(`${apiBase}/api/game/${gameId}`, { signal: controller.signal });
                if (res.ok) {
                    const data = await res.json();
                    if (data.hostName) {
                        setHostName(data.hostName);
                    }
                }
            } catch (e) {
                console.warn('Could not fetch game preview:', e);
            }
        };
        fetchPreview();
        return () => controller.abort();
    }, [gameId]);

    // Auto-join when authenticated and connected
    useEffect(() => {
        if (!user || !connected || !gameId || joinError || showSwitchConfirm) return;

        // Don't auto-join if user just explicitly left a game
        const justLeft = sessionStorage.getItem('justLeftGame');
        if (justLeft) {
            console.log('[Invitation] User just left, clearing flag before auto-join');
            sessionStorage.removeItem('justLeftGame');
        }

        const currentGameId = gameState?.gameId;

        // Case 2: Already in the correct game - will be handled by redirect effect
        if (currentGameId === gameId) {
            return;
        }

        // Case 3: In a different game - ASK CONFIRMATION
        if (currentGameId && currentGameId !== gameId) {
            if (!joiningAttempted) {
                console.log('🔄 User in another game, asking for confirmation...');
                setShowSwitchConfirm(true);
            }
            return;
        }

        // Case 1: No current game - join directly
        if (!currentGameId && !joiningAttempted) {
            console.log('🔄 Auto-joining game:', gameId);
            emit('join-game', gameId);
            setJoiningAttempted(true);
        }
    }, [user, connected, gameId, gameState?.gameId, joinError, joiningAttempted, emit, showSwitchConfirm]);

    // Redirect to game room once joined
    useEffect(() => {
        if (gameState?.gameId === gameId) {
            navigate(`/app/game/${gameId}`, { replace: true });
        }
    }, [gameState?.gameId, gameId, navigate]);

    // Handle email auth navigation
    const handleGoToEmailAuth = () => {
        // Store gameId in session and redirect to login
        sessionStorage.setItem('pendingGameId', gameId);
        navigate('/login?mode=email');
    };

    // Confirm Switch Action
    const handleConfirmSwitch = () => {
        // Leave current game then join new one
        if (gameState?.gameId) {
            emit('leave-game', gameState.gameId);
        }
        // Small delay to ensure clean state on server
        setTimeout(() => {
            emit('join-game', gameId);
            setJoiningAttempted(true);
            setShowSwitchConfirm(false);
        }, 300);
    };

    // Create New Game Action (Alternative to waiting)
    const handleCreateNewGame = () => {
        // Creating a game will auto-join it
        emit('create-game');
        // Navigate to app base, enabling Layout to redirect to new game when state updates
        navigate('/app');
    };

    // Wait Action
    const handleWait = () => {
        navigate(`/app/wait/${gameId}`);
    };

    // Loading auth state
    if (authLoading) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <Spinner size="lg" />
            </div>
        );
    }

    // Not authenticated - show invitation with login options
    if (!user) {
        return (
            <LandingPage
                onLogin={login}
                onGoToEmailAuth={handleGoToEmailAuth}
                isLoading={authLoading}
                onOpenInstructions={() => { }}
                onOpenFeedback={() => { }}
                invitedGameId={gameId}
                hostName={hostName}
            />
        );
    }

    // Modal: Confirm Switch Game
    if (showSwitchConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                    <div className="flex justify-center">
                        <img
                            src={bellImg}
                            alt="Invitación"
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30 shadow-2xl animate-pulse-slow"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif text-neutral-50 mb-4">¡Te han invitado!</h2>
                        <p className="text-neutral-300 text-lg leading-relaxed">
                            <span className="font-bold text-orange-400">{hostName || 'Un anfitrión'}</span> te invita a su partida.
                            <br /><span className="text-sm text-neutral-500 mt-2 block">¿Quieres abandonar tu partida actual para unirte?</span>
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={handleConfirmSwitch}
                            variant="primary"
                            size="lg"
                            className="w-full text-lg shadow-orange-900/20 shadow-lg"
                        >
                            Unirme a la partida
                        </Button>
                        <Button
                            onClick={() => navigate('/app')}
                            variant="ghost"
                            size="md"
                            className="w-full text-neutral-500 hover:text-neutral-300"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Error joining game (including In Progress)
    if (joinError) {
        let errorTitle = "No se pudo unir";
        let errorMsg = typeof joinError === 'string' ? joinError : joinError.message || 'Error desconocido';
        const errorString = typeof joinError === 'string' ? joinError : joinError.message || '';
        const isGameInProgress = /partida en curso/i.test(errorString) || joinError.type === 'in-progress';

        // Use hostName from error payload if available, else fallback to preview
        const displayHostName = joinError.hostName || hostName || 'el anfitrión';

        if (isGameInProgress) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
                    <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                        <div className="flex justify-center mb-2">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/30 shadow-lg shadow-red-900/20">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif text-neutral-50 mb-3">Partida en curso</h2>
                            <p className="text-neutral-400 leading-relaxed">
                                La partida de <span className="text-orange-400 font-bold">{displayHostName}</span> ya está en curso y no te puedes unir.
                                <br /><br />
                                Puedes crear una nueva partida para jugar con tus amigos.
                            </p>
                        </div>
                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={handleCreateNewGame}
                                variant="primary"
                                className="w-full"
                            >
                                Crear nueva partida
                            </Button>
                            <Button
                                onClick={() => {
                                    clearJoinError();
                                    navigate('/app');
                                }}
                                variant="ghost"
                                className="w-full text-neutral-500"
                            >
                                Volver al inicio
                            </Button>
                        </div>
                    </div>
                </div>
            );
        } else if (/no existe/i.test(errorString)) {
            errorTitle = "Enlace no válido";
            errorMsg = "No encontramos esta partida. Es posible que el anfitrión la haya cerrado.";
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
                <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                    <div className="flex justify-center">
                        <div className="relative">
                            <img
                                src={bellImg}
                                alt="Error"
                                className="w-24 h-24 rounded-full object-cover ring-4 ring-red-500/20 grayscale"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-neutral-900 rounded-full p-2 border border-neutral-800">
                                <span className="text-2xl">🚫</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif text-neutral-50 mb-3">{errorTitle}</h2>
                        <p className="text-neutral-400 leading-relaxed">{errorMsg}</p>
                    </div>
                    <div className="space-y-3 pt-2">
                        <Button
                            onClick={() => {
                                clearJoinError();
                                navigate('/app');
                            }}
                            variant="primary"
                            className="w-full"
                        >
                            Ir al inicio
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated and joining
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white">
            <div className="w-full max-w-sm mx-auto text-center space-y-6 px-6">
                <div className="flex justify-center">
                    <img
                        src={bellImg}
                        alt="Uniendo"
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30 shadow-2xl animate-pulse"
                    />
                </div>
                <div>
                    <h2 className="text-3xl font-serif text-neutral-50 mb-4">Uniéndose...</h2>
                    <p className="text-neutral-300 text-lg leading-relaxed animate-pulse">
                        Conectando con la sala de <span className="font-mono font-bold text-orange-400">{hostName || gameId}</span>
                    </p>
                </div>
                <div className="pt-8">
                    <Button
                        onClick={() => navigate('/app')}
                        variant="ghost"
                        size="sm"
                        className="text-neutral-500 hover:text-neutral-300"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
}
