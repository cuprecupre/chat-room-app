/**
 * Landing Page (Public)
 * 
 * This is a wrapper around the existing LandingPage component.
 * It provides the public-facing marketing page at route `/`.
 */
import { LandingPage } from '../../components/LandingPage';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Landing() {
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();
    const [showEmailAuth, setShowEmailAuth] = useState(false);

    // If user is already authenticated, redirect to app dashboard
    useEffect(() => {
        if (user && !loading) {
            navigate('/app', { replace: true });
        }
    }, [user, loading, navigate]);

    // Handle email authentication mode toggle
    const handleGoToEmailAuth = () => {
        navigate('/login?mode=email');
    };

    // If loading or redirecting, don't show the page
    if (loading || user) {
        return null;
    }

    return (
        <LandingPage
            onLogin={login}
            onGoToEmailAuth={handleGoToEmailAuth}
            isLoading={loading}
            onOpenInstructions={() => { }} // Could be handled via modal context
            onOpenFeedback={() => { }}
        />
    );
}
