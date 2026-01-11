import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";

const PlayerStatsContext = createContext(null);

/**
 * Provider that manages player stats state and shares it across components.
 * Listens for stats-updated socket events to refresh automatically.
 */
export function PlayerStatsProvider({ children, uid, socketRef }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`/api/player/${uid}/stats`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("[PlayerStats] Fetched:", data);
                setStats(data);
            })
            .catch((err) => {
                console.error("[PlayerStats] Error fetching stats:", err);
                setError(err);
                setStats({
                    points: 0,
                    gamesPlayed: 0,
                    gamesCompleted: 0,
                    gamesAbandoned: 0,
                    gamesAsImpostor: 0,
                    winsAsImpostor: 0,
                    winsAsFriend: 0,
                    playTimeSeconds: 0,
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [uid]);

    // Initial fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Listen for stats-updated socket event
    useEffect(() => {
        if (!socketRef?.current) return;

        const socket = socketRef.current;

        const handleStatsUpdated = () => {
            console.log("[PlayerStats] Received stats-updated, refetching...");
            // Small delay to ensure DB write is complete
            setTimeout(fetchStats, 500);
        };

        socket.on("stats-updated", handleStatsUpdated);

        return () => {
            socket.off("stats-updated", handleStatsUpdated);
        };
    }, [socketRef, fetchStats]);

    return (
        <PlayerStatsContext.Provider value={{ stats, loading, error, refetch: fetchStats }}>
            {children}
        </PlayerStatsContext.Provider>
    );
}

/**
 * Hook to access shared player stats.
 */
export function usePlayerStats() {
    const context = useContext(PlayerStatsContext);
    if (!context) {
        return { stats: null, loading: true, error: null, refetch: () => { } };
    }
    return context;
}
