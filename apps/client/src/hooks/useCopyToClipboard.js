import { useCallback, useMemo } from "react";
import { showToast } from "../lib/toast";

export function useCopyToClipboard() {
    const isMobile = useMemo(() => {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }, []);

    const copyLink = useCallback(
        async (gameId) => {
            if (!gameId) return;
            const url = `${window.location.origin}?gameId=${gameId}`;

            // On mobile, use native share API (requires HTTPS in production)
            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: "Únete a mi juego de El Impostor",
                        url: url,
                    });
                    return;
                } catch (err) {
                    // If user cancels, do nothing
                    if (err.name === "AbortError") {
                        return;
                    }
                    console.error("Error sharing:", err);
                    showToast("No se pudo compartir");
                    return;
                }
            }

            // On desktop or mobile without Web Share, copy to clipboard
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                    showToast("Enlace copiado");
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = url;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    const successful = document.execCommand("copy");
                    document.body.removeChild(textArea);

                    if (successful) {
                        showToast("Enlace copiado");
                    }
                }
            } catch (err) {
                console.error("Error copying:", err);
            }
        },
        [isMobile]
    );

    const copyGameCode = useCallback(
        async (gameId) => {
            if (!gameId) return;

            // On mobile, use native share API (requires HTTPS in production)
            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: "Código de partida - El Impostor",
                        text: `Código de partida: ${gameId}`,
                    });
                    return;
                } catch (err) {
                    // If user cancels, do nothing
                    if (err.name === "AbortError") {
                        return;
                    }
                    console.error("Error sharing:", err);
                    showToast("No se pudo compartir");
                    return;
                }
            }

            // On desktop or mobile without Web Share, copy to clipboard
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(gameId);
                    showToast("Código copiado");
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = gameId;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    const successful = document.execCommand("copy");
                    document.body.removeChild(textArea);

                    if (successful) {
                        showToast("Código copiado");
                    }
                }
            } catch (err) {
                console.error("Error copying:", err);
            }
        },
        [isMobile]
    );

    return {
        copyLink,
        copyGameCode,
        isMobile,
    };
}
