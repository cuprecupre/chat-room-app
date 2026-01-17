import { Outlet, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";

import { Footer } from "../components/Footer";
import { AppHeader } from "../components/AppHeader";
import { LeaveMatchModal } from "../components/LeaveMatchModal";
import { LeaveRoomModal } from "../components/LeaveRoomModal";
import { ROUTES } from "../routes/routes";

export function MainLayout({
    user,
    gameState,
    emit,
    onLogout,
    onOpenInstructions,
    onOpenFeedback,
    onCopyLink,
    isMobile,
    isHost,
}) {
    const [showLeaveRoomModal, setShowLeaveRoomModal] = useState(false);
    const [showLeaveMatchModal, setShowLeaveMatchModal] = useState(false);
    const navigate = useNavigate();

    const leaveRoom = useCallback(() => {
        if (gameState?.roomId) {
            // Remove roomId from URL immediately to prevent accidental reopen
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Emit leave-room and navigate to lobby
            emit("leave-room", gameState.roomId);
            navigate(ROUTES.LOBBY);
        }
    }, [emit, gameState, navigate]);

    const leaveMatch = useCallback(() => {
        if (gameState?.roomId) {
            emit("leave-match", gameState.roomId);
            setShowLeaveMatchModal(false);
        }
    }, [emit, gameState]);

    const handleLeaveMatchClick = useCallback(() => {
        setShowLeaveMatchModal(true);
    }, []);

    const handleTitleClick = useCallback(() => {
        // If in a room (lobby or playing), show confirmation modal
        if (gameState?.roomId) {
            setShowLeaveRoomModal(true);
        } else {
            // If not in room, go directly to lobby
            navigate(ROUTES.LOBBY);
        }
    }, [gameState, navigate]);

    return (
        <div className="bg-neutral-950 text-white min-h-[100dvh] font-sans flex flex-col">
            {/* Header - Full width */}
            <div className="w-full px-6 py-4 sm:px-6 border-b border-white/10">
                <AppHeader
                    user={user}
                    gameState={gameState}
                    emit={emit}
                    onLogout={onLogout}
                    onTitleClick={handleTitleClick}
                    onLeaveRoomClick={() => setShowLeaveRoomModal(true)}
                    onLeaveMatchClick={handleLeaveMatchClick}
                />
            </div>

            {/* Main content */}
            <div className="w-full max-w-4xl mx-auto px-6 py-4 sm:p-6 lg:p-8">
                <main>
                    <Outlet />
                </main>
            </div>

            {/* Footer - Full width */}
            <div className="w-full px-6 py-4 border-t border-white/10 mt-auto">
                <Footer
                    onOpenInstructions={onOpenInstructions}
                    onOpenFeedback={onOpenFeedback}
                    roomId={gameState?.roomId}
                    onCopyLink={onCopyLink}
                    isMobile={isMobile}
                    phase={gameState?.phase}
                    onLeaveMatch={handleLeaveMatchClick}
                    onLeaveRoom={() => setShowLeaveRoomModal(true)}
                />
            </div>

            {/* Modal de confirmación para abandonar sala */}
            <LeaveRoomModal
                isOpen={showLeaveRoomModal}
                onClose={() => setShowLeaveRoomModal(false)}
                onConfirm={() => {
                    setShowLeaveRoomModal(false);
                    leaveRoom();
                }}
            />

            {/* Modal de confirmación para abandonar partida */}
            <LeaveMatchModal
                isOpen={showLeaveMatchModal}
                onClose={() => setShowLeaveMatchModal(false)}
                onConfirm={leaveMatch}
                isGameOver={gameState?.phase === "game_over"}
                isHost={isHost}
            />
        </div>
    );
}
