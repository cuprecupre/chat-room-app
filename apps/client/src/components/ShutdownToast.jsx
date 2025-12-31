import React from "react";

/**
 * ShutdownToast - Displays a persistent countdown toast during server shutdown.
 * Shows the remaining time until server maintenance begins.
 */
export function ShutdownToast({ shutdownCountdown }) {
    if (!shutdownCountdown) return null;

    const { remainingSeconds, message } = shutdownCountdown;

    // Format time for display
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Urgent styling when under 60 seconds
    const isUrgent = remainingSeconds <= 60;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
            <div
                className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
                    ${
                        isUrgent
                            ? "bg-red-950/95 border-red-500/50 text-red-100"
                            : "bg-amber-950/95 border-amber-500/50 text-amber-100"
                    }
                    backdrop-blur-sm
                `}
            >
                {/* Warning Icon */}
                <svg
                    className={`w-5 h-5 flex-shrink-0 ${isUrgent ? "text-red-400" : "text-amber-400"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>

                {/* Message */}
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {message || `Mantenimiento del servidor en ${timeDisplay}`}
                    </span>
                    <span className={`text-xs ${isUrgent ? "text-red-300" : "text-amber-300"}`}>
                        Las partidas activas finalizarán pronto
                    </span>
                </div>

                {/* Countdown Badge */}
                <div
                    className={`
                        ml-2 px-2 py-1 rounded font-mono text-sm font-bold
                        ${isUrgent ? "bg-red-500/30 text-red-200" : "bg-amber-500/30 text-amber-200"}
                    `}
                >
                    {timeDisplay}
                </div>
            </div>
        </div>
    );
}
