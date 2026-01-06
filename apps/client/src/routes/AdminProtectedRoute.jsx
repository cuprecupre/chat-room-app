import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { PageLoader } from "../components/ui/PageLoader";
import { ROUTES } from "./routes";

/**
 * Route component that only renders children if the user is an admin.
 * Redirects to home if not authenticated or not an admin.
 */
export function AdminProtectedRoute({ children }) {
    const { isAdmin, loading, user } = useAdminAuth();

    // Show loader while checking auth + admin status
    if (loading) {
        return <PageLoader />;
    }

    // Not logged in - redirect to home
    if (!user) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    // Logged in but not admin - redirect to lobby
    if (!isAdmin) {
        return <Navigate to={ROUTES.LOBBY} replace />;
    }

    // User is admin - render children
    return children;
}
