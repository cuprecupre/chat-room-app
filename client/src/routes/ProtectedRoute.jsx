import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import heroImg from '../assets/impostor-home.png';

/**
 * ProtectedRoute - Guards routes that require authentication.
 * If user is not authenticated, redirects to /login with return path.
 */
export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth status
    if (loading) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-6 text-center">
                    <img
                        src={heroImg}
                        alt="El Impostor"
                        className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <Spinner size="md" />
                        <div>
                            <p>Verificando sesión</p>
                            <p className="text-sm text-neutral-400 mt-1">Un momento...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If not authenticated, redirect to login with return path
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // User is authenticated, render the protected content
    return children;
}
