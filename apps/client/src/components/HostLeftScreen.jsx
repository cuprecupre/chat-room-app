import React, { useEffect, useState } from "react";

/**
 * HostLeftScreen - Displayed when the host abandons the match.
 * Shows a message with spinner for 4 seconds, then triggers redirect to lobby.
 */
export function HostLeftScreen({ onRedirectToLobby }) {
    const [countdown, setCountdown] = useState(4);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Redirect to lobby after countdown
            if (onRedirectToLobby) {
                onRedirectToLobby();
            }
        }
    }, [countdown, onRedirectToLobby]);

    return (
        <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50">
            <div className="text-center space-y-6 max-w-sm mx-auto px-6">
                {/* Emoji or Icon */}
                <div className="text-6xl">👋</div>

                {/* Title */}
                <h2 className="text-2xl font-serif text-neutral-50">
                    El anfitrión ha abandonado la partida
                </h2>

                {/* Subtitle */}
                <p className="text-neutral-400">
                    Te redirigiremos a la sala en unos instantes...
                </p>

                {/* Spinner */}
                <div className="flex justify-center">
                    <svg
                        className="animate-spin h-8 w-8 text-orange-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </div>

                {/* Countdown (subtle) */}
                <p className="text-sm text-neutral-600">
                    Redirigiendo en {countdown}s
                </p>
            </div>
        </div>
    );
}
