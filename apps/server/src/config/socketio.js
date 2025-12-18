const socketIo = require("socket.io");

const defaultDevOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
];

/**
 * Get dynamic origins from environment.
 */
function getDynamicOrigins() {
    return (process.env.CLIENT_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Build CORS origin configuration based on environment.
 */
function buildCorsOrigin() {
    const dynamicOrigins = getDynamicOrigins();

    if (process.env.NODE_ENV === "production") {
        // In production, restrict to known origins
        return [...defaultDevOrigins, ...dynamicOrigins];
    }

    // In development, allow localhost and local network IPs
    return (origin, callback) => {
        if (
            !origin ||
            origin.includes("localhost") ||
            /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin) ||
            dynamicOrigins.includes(origin)
        ) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    };
}

/**
 * Create and configure Socket.IO server.
 */
function createSocketServer(httpServer) {
    const corsOrigin = buildCorsOrigin();

    const io = socketIo(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ["GET", "POST"],
        },
    });

    return io;
}

module.exports = { createSocketServer, getDynamicOrigins };
