import { createBrowserRouter, Navigate } from 'react-router-dom';

// Public pages
import { Landing } from '../pages/public/Landing';
import { Rules } from '../pages/public/Rules';
import { Login } from '../pages/public/Login';
import { Invitation } from '../pages/public/Invitation';

// Private pages
import { AppLayout } from '../pages/app/Layout';
import { Dashboard } from '../pages/app/Dashboard';
import { Game } from '../pages/app/Game';
import { WaitingRoom } from '../pages/app/WaitingRoom';

// Guards
import { ProtectedRoute } from './ProtectedRoute';

// 404 Page
import { NotFound } from '../pages/NotFound';

/**
 * Application Router Configuration
 * 
 * Public Routes:
 *   /           - Landing page (marketing)
 *   /reglas     - Rules page
 *   /login      - Login page
 *   /join/:gameId - Game invitation page
 * 
 * Private Routes (require auth):
 *   /app              - User dashboard (lobby)
 *   /app/game/:gameId - Active game room
 * 
 * Legacy Redirects:
 *   /?gameId=XYZ -> /join/XYZ (handled by server)
 */
export const router = createBrowserRouter([
    // ========== PUBLIC ROUTES ==========
    {
        path: '/',
        element: <Landing />,
    },
    {
        path: '/reglas',
        element: <Rules />,
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/join/:gameId',
        element: <Invitation />,
    },

    // ========== PRIVATE ROUTES ==========
    {
        path: '/app',
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'game/:gameId',
                element: <Game />,
            },
            {
                path: 'wait/:gameId',
                element: <WaitingRoom />,
            },
        ],
    },

    // ========== FALLBACK ROUTES ==========
    {
        path: '*',
        element: <NotFound />,
    },
]);
