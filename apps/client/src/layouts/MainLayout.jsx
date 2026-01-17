import { useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { AppHeader } from "../components/AppHeader";
import { SidebarMenu } from "../components/SidebarMenu";
import { LeaveMatchModal } from "../components/LeaveMatchModal";
import { LeaveRoomModal } from "../components/LeaveRoomModal";
import { ROUTES } from "../routes/routes";
import { usePlayerStats } from "../hooks/usePlayerStats";

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { stats } = usePlayerStats();

    const handleLogout = useCallback(async () => {
        try {
            // Clear URL parameters before logout
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());

            // Leave room if in one
            if (gameState?.roomId) {
                emit("leave-room", gameState.roomId);
            }

            await onLogout();
            navigate(ROUTES.HOME);
        } catch (e) {
            console.error("Error during logout:", e);
        }
    }, [onLogout, emit, gameState, navigate]);

    const leaveRoom = useCallback(() => {
        if (gameState?.roomId) {
            const url = new URL(window.location);
            url.searchParams.delete("roomId");
            window.history.replaceState({}, "", url.toString());
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

    const handleTitleClick = useCallback(() => {
        if (gameState?.roomId) {
            setShowLeaveRoomModal(true);
        } else {
            navigate(ROUTES.LOBBY);
        }
    }, [gameState, navigate]);

    return (
        <div className="bg-neutral-950 text-white min-h-screen font-sans flex flex-col overflow-x-hidden">
            {/* Sidebar Menu */}
            {user && (
                <SidebarMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    user={user}
                    stats={stats}
                    gameState={gameState}
                    onLogout={handleLogout}
                    onLeaveRoom={() => setShowLeaveRoomModal(true)}
                    onLeaveMatch={() => setShowLeaveMatchModal(true)}
                    onOpenInstructions={onOpenInstructions}
                    onOpenFeedback={onOpenFeedback}
                />
            )}

            {/* Header - Full width */}
            <div className="w-full px-2 py-4 sm:px-6 border-b border-white/10">
                <AppHeader
                    user={user}
                    onTitleClick={handleTitleClick}
                    onOpenMenu={() => setIsMenuOpen(true)}
                />
            </div>

            {/* Main content */}
            <div className="w-full max-w-4xl mx-auto px-2 py-4 sm:p-6 lg:p-8">
                <main>
                    <Outlet />
                </main>
            </div>

            {/* Footer - Full width, hidden when in room/game */}
            {!gameState?.roomId && (
                <div className="w-full px-6 py-4 border-t border-white/10 mt-auto">
                    <Footer roomId={gameState?.roomId} />
                </div>
            )}

            {/* Modals */}
            <LeaveRoomModal
                isOpen={showLeaveRoomModal}
                onClose={() => setShowLeaveRoomModal(false)}
                onConfirm={() => {
                    setShowLeaveRoomModal(false);
                    leaveRoom();
                }}
            />

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
