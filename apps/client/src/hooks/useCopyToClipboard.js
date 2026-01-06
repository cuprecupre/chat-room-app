import { useCallback, useMemo } from "react";
import { showToast } from "../lib/toast";

export function useCopyToClipboard() {
    const isMobile = useMemo(() => {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }, []);

    const copyLink = useCallback(
        async (roomId) => {
            if (!roomId) return;
            const url = `${window.location.origin}?roomId=${roomId}`;

            // On mobile, use native share API (requires HTTPS in production)
            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: "¡Únete a mi partida de El Impostor!",
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
        async (roomId) => {
            if (!roomId) return;

            // On mobile, use native share API (requires HTTPS in production)
            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: "Código de sala - El Impostor",
                        text: `Código de sala: ${roomId}`,
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
                    await navigator.clipboard.writeText(roomId);
                    showToast("Código copiado");
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = roomId;
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
