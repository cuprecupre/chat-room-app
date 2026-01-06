import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getToken } from "../lib/tokenStorage";

/**
 * Hook to verify if the current user is an admin.
 * Makes a request to /api/admin/verify to check admin status.
 */
export function useAdminAuth() {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const verifyAdmin = useCallback(async () => {
        if (!user) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = getToken();

            if (!token) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            const response = await fetch("/api/admin/verify", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setIsAdmin(data.isAdmin === true);
            } else {
                // 401, 403, or any other error means not admin
                setIsAdmin(false);
            }
        } catch (err) {
            console.error("Error verifying admin status:", err);
            setError(err.message);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            verifyAdmin();
        }
    }, [authLoading, verifyAdmin]);

    return {
        isAdmin,
        loading: authLoading || loading,
        error,
        user,
        refetch: verifyAdmin,
    };
}
