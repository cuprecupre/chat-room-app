import React from "react";
import { useParams } from "react-router-dom";
import { RoundStartOverlay } from "../components/RoundStartOverlay";
import { RoundResultOverlay } from "../components/RoundResultOverlay";
import { GameOverScreen } from "../components/GameOverScreen";
import { InstructionsModal } from "../components/InstructionsModal";
import { FeedbackModal } from "../components/FeedbackModal";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { GameRoom } from "../components/GameRoom";

export default function DebugPreviewSingle() {
    const { viewId } = useParams();

    // Mock User
    const currentUser = { uid: "user1", name: "Developer", photoURL: null };
    const guestUser = { uid: "user2", name: "Alice", photoURL: null };
    const impostorUser = { uid: "user4", name: "Charlie", photoURL: null };

    // Mock Players
    const players = [
        { uid: "user1", name: "Developer", photoURL: null },
        { uid: "user2", name: "Alice", photoURL: null },
        { uid: "user3", name: "Bob", photoURL: null },
        { uid: "user4", name: "Charlie", photoURL: null },
    ];

    // Mocks for States
    const mockStateCommon = {
        players,
        currentRound: 1,
        phase: "playing",
        impostorId: "user4",
        secretWord: "Banana",
        startingPlayerId: "user1",
        roundCount: 1,
        hostId: "user1",
        gameId: "DEBUG123",
        currentWord: "Banana",
        playerScores: { user1: 0, user2: 0, user3: 0, user4: 0 },
    };

    // Lobby states
    const mockStateLobbyHost = {
        ...mockStateCommon,
        phase: "lobby",
    };

    const mockStateLobbyGuest = {
        ...mockStateCommon,
        phase: "lobby",
    };

    // GameRoom playing states
    const mockStatePlayingHost = {
        ...mockStateCommon,
        phase: "playing",
    };

    const mockStatePlayingGuest = {
        ...mockStateCommon,
        phase: "playing",
    };

    // Voting states
    const mockStateVotingHost = {
        ...mockStateCommon,
        phase: "voting",
        votes: {},
    };

    const mockStateVotingGuest = {
        ...mockStateCommon,
        phase: "voting",
        votes: { user1: "user3" },
    };

    const mockStateResultElim = {
        ...mockStateCommon,
        phase: "round_result",
        roundHistory: [
            {
                tie: false,
                eliminated: "user3",
                votes: { user1: "user3", user2: "user3", user4: "user3" },
            },
        ],
        lastRoundScores: { user1: 100 },
    };

    const mockStateResultTie = {
        ...mockStateCommon,
        phase: "round_result",
        roundHistory: [{ tie: true, eliminated: null, votes: { user1: "user2", user2: "user3" } }],
        lastRoundScores: { user1: 50 },
    };

    const mockStateGameOverFriendWins = {
        ...mockStateCommon,
        phase: "game_over",
        winner: "Developer",
        winnerId: "user1",
        impostorId: "user4",
        playerScores: { user1: 500, user2: 300, user3: 100, user4: 450 },
    };

    const mockStateGameOverImpostorWins = {
        ...mockStateCommon,
        phase: "game_over",
        winner: "Charlie",
        winnerId: "user4",
        impostorId: "user4",
        playerScores: { user4: 600, user1: 400, user2: 300, user3: 100 },
    };

    const mockStateGameOverTie = {
        ...mockStateCommon,
        phase: "game_over",
        winner: "Empate",
        winnerId: null,
        impostorId: "user4",
        playerScores: { user1: 400, user2: 400, user3: 400, user4: 300 },
    };

    const mockStateGameOverBonus = {
        ...mockStateCommon,
        phase: "game_over",
        winner: "Developer",
        winnerId: "user1",
        impostorId: "user4",
        playerScores: { user1: 10, user2: 10, user3: 10, user4: 2 },
        playerBonus: { user1: 8, user2: 8, user3: 8 },
    };

    const mockStateResultBonus = {
        ...mockStateCommon,
        phase: "round_result",
        roundHistory: [
            {
                tie: false,
                eliminated: "user4",
                votes: { user1: "user4", user2: "user3", user4: "user1" },
            },
        ],
        playerScores: { user1: 10, user2: 2, user3: 0, user4: 0 },
        lastRoundScores: { user1: 2, user2: 0, user3: 0, user4: 0 },
        playerBonus: { user1: 8 },
    };

    const mockStateGameOverSingleBonus = {
        ...mockStateCommon,
        phase: "game_over",
        winner: "Developer",
        winnerId: "user1",
        impostorId: "user4",
        playerScores: { user1: 10, user2: 4, user3: 2, user4: 2 },
        playerBonus: { user1: 4 },
    };

    const noop = () => { };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans">
            {/* Overlays de Ronda */}
            {viewId === "r1" && (
                <RoundStartOverlay
                    state={{ ...mockStateCommon, phase: "playing", currentRound: 1 }}
                />
            )}
            {viewId === "r2" && (
                <RoundStartOverlay
                    state={{ ...mockStateCommon, phase: "playing", currentRound: 2 }}
                />
            )}
            {viewId === "r3" && (
                <RoundStartOverlay
                    state={{ ...mockStateCommon, phase: "playing", currentRound: 3 }}
                />
            )}

            {/* Resultados de Ronda */}
            {viewId === "result_elim_host" && (
                <RoundResultOverlay
                    state={mockStateResultElim}
                    isHost={true}
                    onNextRound={noop}
                    currentUserId={currentUser.uid}
                />
            )}
            {viewId === "result_elim_guest" && (
                <RoundResultOverlay
                    state={mockStateResultElim}
                    isHost={false}
                    onNextRound={noop}
                    currentUserId={guestUser.uid}
                />
            )}
            {viewId === "result_tie_host" && (
                <RoundResultOverlay
                    state={mockStateResultTie}
                    isHost={true}
                    onNextRound={noop}
                    currentUserId={currentUser.uid}
                />
            )}
            {viewId === "result_tie_guest" && (
                <RoundResultOverlay
                    state={mockStateResultTie}
                    isHost={false}
                    onNextRound={noop}
                    currentUserId={guestUser.uid}
                />
            )}

            {/* Game Over */}
            {viewId === "gameover_friend_host" && (
                <GameOverScreen
                    state={mockStateGameOverFriendWins}
                    isHost={true}
                    onPlayAgain={noop}
                    user={currentUser}
                />
            )}
            {viewId === "gameover_friend_guest" && (
                <GameOverScreen
                    state={mockStateGameOverFriendWins}
                    isHost={false}
                    onPlayAgain={noop}
                    user={guestUser}
                />
            )}
            {viewId === "gameover_impostor_host" && (
                <GameOverScreen
                    state={mockStateGameOverImpostorWins}
                    isHost={true}
                    onPlayAgain={noop}
                    user={currentUser}
                />
            )}
            {viewId === "gameover_impostor_guest" && (
                <GameOverScreen
                    state={mockStateGameOverImpostorWins}
                    isHost={false}
                    onPlayAgain={noop}
                    user={guestUser}
                />
            )}
            {viewId === "gameover_tie" && (
                <GameOverScreen
                    state={mockStateGameOverTie}
                    isHost={true}
                    onPlayAgain={noop}
                    user={currentUser}
                />
            )}
            {viewId === "gameover_bonus" && (
                <GameOverScreen
                    state={mockStateGameOverBonus}
                    isHost={true}
                    onPlayAgain={noop}
                    user={currentUser}
                />
            )}
            {viewId === "gameover_single_bonus" && (
                <GameOverScreen
                    state={mockStateGameOverSingleBonus}
                    isHost={true}
                    onPlayAgain={noop}
                    user={currentUser}
                />
            )}
            {viewId === "result_bonus" && (
                <RoundResultOverlay
                    state={mockStateResultBonus}
                    isHost={true}
                    onNextRound={noop}
                    currentUserId={currentUser.uid}
                />
            )}

            {/* Modals */}
            {viewId === "modal_instructions" && <InstructionsModal isOpen={true} onClose={noop} />}
            {viewId === "modal_feedback" && (
                <FeedbackModal isOpen={true} onClose={noop} user={currentUser} />
            )}
            {viewId === "modal_scoring" && (
                <>
                    <GameOverScreen
                        state={mockStateGameOverFriendWins}
                        isHost={true}
                        onPlayAgain={noop}
                        user={currentUser}
                    />
                    <p className="fixed top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded z-[100] text-sm">
                        Haz clic en "¿Cómo se calculan los puntos?"
                    </p>
                </>
            )}
            {viewId === "modal_endgame" && (
                <Modal isOpen={true} onClose={noop} title="¿Terminar partida?">
                    <div className="space-y-4">
                        <p className="text-neutral-300">
                            ¿Estás seguro de que deseas terminar la partida? Todos los jugadores
                            serán expulsados.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={noop}>
                                Cancelar
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={noop}>
                                Terminar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            {viewId === "modal_leave" && (
                <Modal isOpen={true} onClose={noop} title="¿Abandonar partida?">
                    <div className="space-y-4">
                        <p className="text-neutral-300">
                            ¿Estás seguro de que deseas abandonar la partida?
                        </p>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={noop}>
                                Cancelar
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={noop}>
                                Abandonar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
