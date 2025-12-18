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

    console.log("🔐 [AUTH] Intento de conexión:", {
        socketId: socket.id,
        ip: clientIp,
        userAgent: userAgent ? userAgent.substring(0, 100) : "N/A",
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        name: name || "N/A",
        hasPhotoURL: !!photoURL,
    });

    if (!token) {
        console.error("❌ [AUTH] Error: No se proporcionó token", {
            socketId: socket.id,
            ip: clientIp,
        });
        return next(new Error("Authentication error: No token provided."));
    }

    try {
        console.log("🔍 [AUTH] Verificando token con Firebase Admin...");
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("✅ [AUTH] Token verificado exitosamente:", {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || name,
            emailVerified: decodedToken.email_verified,
            authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
            issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
            expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
        });

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
