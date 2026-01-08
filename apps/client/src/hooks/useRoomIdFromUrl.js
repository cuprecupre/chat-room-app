import { useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to extract roomId from URL search params
 * @returns {string|null} The roomId from URL or null if not present
 */
export function useRoomIdFromUrl() {
    const location = useLocation();
    return useMemo(
        () => new URLSearchParams(location.search).get("roomId"),
        [location.search]
    );
}
