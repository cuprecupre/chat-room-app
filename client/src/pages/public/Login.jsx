/**
 * Login Page (Public)
 * 
 * Provides login options (Google, Email) at route `/login`.
 * Redirects to /app after successful authentication.
 */
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { EmailAuthScreen } from '../../components/EmailAuthScreen';
import { Button } from '../../components/ui/Button';
import heroImg from '../../assets/impostor-home.png';

export function Login() {
    const { user, loading, login, loginWithEmail, registerWithEmail, error, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check if we should show email auth mode
    const mode = searchParams.get('mode');
    const [showEmailAuth, setShowEmailAuth] = useState(mode === 'email');

    // Get the return path from state (set by ProtectedRoute)
    const from = location.state?.from || '/app';

    // Redirect to intended destination after login
    useEffect(() => {
        if (user && !loading) {
            navigate(from, { replace: true });
        }
    }, [user, loading, navigate, from]);

    // If loading or authenticated, show loading state
    if (loading) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-neutral-950 text-white">
                <div className="flex flex-col items-center gap-6 text-center">
                    <img
                        src={heroImg}
                        alt="El Impostor"
                        className="w-32 h-32 rounded-full object-cover shadow-xl ring-1 ring-white/10"
                    />
                    <p className="text-neutral-400">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (user) {
        return null; // Will redirect via useEffect
    }

    // Email authentication mode
    if (showEmailAuth) {
        return (
            <EmailAuthScreen
                onLoginWithEmail={loginWithEmail}
                onRegisterWithEmail={registerWithEmail}
                onBack={() => setShowEmailAuth(false)}
                isLoading={loading}
                error={error}
                clearError={clearError}
            />
        );
    }

    // Main login screen
    return (
        <div className="w-full min-h-[100dvh] flex items-center justify-center bg-neutral-950 text-white p-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <img
                        src={heroImg}
                        alt="El Impostor"
                        className="w-24 h-24 rounded-full object-cover shadow-xl ring-1 ring-white/10 mx-auto"
                    />
                    <h1 className="text-3xl font-serif">El Impostor</h1>
                    <p className="text-neutral-400">Inicia sesión para continuar</p>
                </div>

                {/* Login Options */}
                <div className="space-y-4">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={login}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => setShowEmailAuth(true)}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                            <path d="M3 7l9 6 9-6" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Continuar con Email
                    </Button>
                </div>

                {/* Back to Home */}
                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-neutral-500 hover:text-neutral-300"
                    >
                        Volver al inicio
                    </Button>
                </div>
            </div>
        </div>
    );
}
