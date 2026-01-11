// Route path constants
export const ROUTES = {
    HOME: "/",
    AUTH: "/auth",
    GUEST_AUTH: "/guest",
    RULES: "/reglas",
    LOBBY: "/lobby",
    GAME: "/game",
    PROFILE: "/profile",
    ADMIN: "/admin",
};

// Route configuration with metadata
export const routeConfig = [
    {
        path: ROUTES.HOME,
        name: "Landing",
        isProtected: false,
    },
    {
        path: ROUTES.AUTH,
        name: "Email Auth",
        isProtected: false,
    },
    {
        path: ROUTES.GUEST_AUTH,
        name: "Guest Auth",
        isProtected: false,
    },
    {
        path: ROUTES.RULES,
        name: "Rules",
        isProtected: false,
    },
    {
        path: ROUTES.LOBBY,
        name: "Lobby",
        isProtected: true,
    },
    {
        path: ROUTES.GAME,
        name: "Game",
        isProtected: true,
    },
];
