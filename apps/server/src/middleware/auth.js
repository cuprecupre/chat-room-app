const { admin } = require("../config/firebase");

/**
 * Express middleware to verify Firebase ID tokens.
 */
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Unauthorized: No token provided");
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("Error verifying Firebase token:", error);
        return res.status(401).send("Unauthorized: Invalid token");
    }
};

/**
 * Socket.IO middleware to verify Firebase ID tokens.
 */
const socketAuthMiddleware = async (socket, next) => {
    const { token, name, photoURL } = socket.handshake.auth;
    const clientIp = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
    const userAgent = socket.handshake.headers["user-agent"];

    if (!token) {
        console.error("❌ [AUTH] No token provided -", {
            socketId: socket.id,
            ip: clientIp,
        });
        return next(new Error("Authentication error: No token provided."));
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Simplified auth log - only show essential info
        console.log(`✅ [AUTH] ${name || decodedToken.name} (${decodedToken.uid})`);

        socket.user = {
            uid: decodedToken.uid,
            name: name || decodedToken.name,
            photoURL: photoURL,
        };
        next();
    } catch (error) {
        console.error("❌ [AUTH] Error al verificar token:", {
            socketId: socket.id,
            ip: clientIp,
            errorCode: error.code,
            errorMessage: error.message,
            errorStack: error.stack,
        });
        next(new Error("Authentication error: Invalid token."));
    }
};

module.exports = { verifyFirebaseToken, socketAuthMiddleware };
