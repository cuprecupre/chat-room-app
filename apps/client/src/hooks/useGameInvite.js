import { useState, useEffect } from "react";

export function useGameInvite(gameState) {
    const [previewHostName, setPreviewHostName] = useState(null);
    const [gameStatus, setGameStatus] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const getUrlRoomId = () => {
        try {
            return new URL(window.location).searchParams.get("roomId");
        } catch (_) {
            return null;
        }
    };

    useEffect(() => {
        const urlRoomId = getUrlRoomId();
        // Fetch preview if we have a URL ID and it's either a new session OR a mismatch with current session
        if (urlRoomId && (!gameState?.roomId || urlRoomId !== gameState.roomId)) {
            // Fetch room preview info
            const controller = new AbortController();
            setIsLoading(true);
            setError(null);

            const fetchPreview = async () => {
                try {
                    // Determine API URL based on environment (dev vs prod)
                    const apiBase =
                        import.meta.env.MODE === "production"
                            ? window.location.origin
                            : `${window.location.protocol}//${window.location.hostname}:3000`;

                    const res = await fetch(`${apiBase}/api/game/${urlRoomId}`, {
                        signal: controller.signal,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setPreviewHostName(data.hostName || null);
                        setGameStatus(data.status || null);

                        // Check if game is in progress (can't join) -> REMOVED
                        // New behavior: Allow joining as late joiner / spectator
                        // if (data.status === "playing") {
                        //    setError("IN_PROGRESS");
                        // }
                    } else if (res.status === 404) {
                        setError("NOT_FOUND");
                    }
                } catch (e) {
                    if (e.name !== "AbortError") {
                        console.warn("⚠️ No se pudo obtener info de la sala:", e);
                        // Network error - treat as not found
                        setError("NOT_FOUND");
                    }
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPreview();
            return () => controller.abort();
        } else {
            setPreviewHostName(null);
            setGameStatus(null);
            setError(null);
        }
    }, [gameState?.roomId]);

    return {
        urlRoomId: getUrlRoomId(),
        previewHostName,
        gameStatus,
        error,
        isLoading,
        clearPreview: () => {
            setPreviewHostName(null);
            setError(null);
        },
    };
}
