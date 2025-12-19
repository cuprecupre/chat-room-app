import { useState, useEffect } from "react";

export function useGameInvite(gameState) {
    const [previewHostName, setPreviewHostName] = useState(null);
    const [gameStatus, setGameStatus] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const getUrlGameId = () => {
        try {
            return new URL(window.location).searchParams.get("gameId");
        } catch (_) {
            return null;
        }
    };

    useEffect(() => {
        const urlGameId = getUrlGameId();
        // Fetch preview if we have a URL ID and it's either a new session OR a mismatch with current session
        if (urlGameId && (!gameState?.gameId || urlGameId !== gameState.gameId)) {
            // Fetch game preview info
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

                    const res = await fetch(`${apiBase}/api/game/${urlGameId}`, {
                        signal: controller.signal,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setPreviewHostName(data.hostName || null);
                        setGameStatus(data.status || null);

                        // Check if game is in progress (can't join)
                        if (data.status === "playing") {
                            setError("IN_PROGRESS");
                        }
                    } else if (res.status === 404) {
                        setError("NOT_FOUND");
                    }
                } catch (e) {
                    if (e.name !== "AbortError") {
                        console.warn("⚠️ No se pudo obtener info de la partida:", e);
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
    }, [gameState?.gameId]);

    return {
        urlGameId: getUrlGameId(),
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
