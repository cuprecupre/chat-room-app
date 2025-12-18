import { useState, useEffect } from "react";

export function useGameInvite(gameState) {
    const [previewHostName, setPreviewHostName] = useState(null);

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
                        if (data.hostName) {
                            setPreviewHostName(data.hostName);
                        }
                    }
                } catch (e) {
                    console.warn("⚠️ No se pudo obtener info de la partida (¿404?):", e);
                    // Ignore abort errors or network errors (UI will show ID as fallback)
                }
            };
            fetchPreview();
            return () => controller.abort();
        } else {
            setPreviewHostName(null);
        }
    }, [gameState?.gameId]);

    return {
        urlGameId: getUrlGameId(),
        previewHostName,
        clearPreview: () => setPreviewHostName(null),
    };
}
