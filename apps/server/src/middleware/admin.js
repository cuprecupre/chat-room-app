const { admin } = require("../config/firebase");

const db = admin.firestore();

// Cache simple para no consultar Firestore en cada request
const adminCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Express middleware to verify if the authenticated user is an admin.
 * Checks the /admins collection in Firestore.
 */
const isAdmin = async (req, res, next) => {
    const uid = req.user?.uid;

    if (!uid) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        // Revisar cache
        const cached = adminCache.get(uid);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            if (cached.isAdmin) return next();
            return res.status(403).json({ error: "Not authorized" });
        }

        // Consultar Firestore
        const doc = await db.collection("admins").doc(uid).get();
        const isAdminUser = doc.exists;

        // Guardar en cache
        adminCache.set(uid, { isAdmin: isAdminUser, timestamp: Date.now() });

        if (isAdminUser) {
            console.log(`✅ [ADMIN] Access granted: ${req.user.name || uid}`);
            return next();
        }

        console.log(`⛔ [ADMIN] Access denied: ${req.user.name || uid}`);
        return res.status(403).json({ error: "Not authorized" });
    } catch (error) {
        console.error("❌ [ADMIN] Error checking admin status:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Socket.IO middleware variant for admin verification.
 */
const isAdminSocket = async (socket, next) => {
    const uid = socket.user?.uid;

    if (!uid) {
        return next(new Error("Not authenticated"));
    }

    try {
        const cached = adminCache.get(uid);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            if (cached.isAdmin) {
                socket.isAdmin = true;
                return next();
            }
            return next(new Error("Not authorized"));
        }

        const doc = await db.collection("admins").doc(uid).get();
        const isAdminUser = doc.exists;

        adminCache.set(uid, { isAdmin: isAdminUser, timestamp: Date.now() });

        if (isAdminUser) {
            socket.isAdmin = true;
            return next();
        }

        return next(new Error("Not authorized"));
    } catch (error) {
        console.error("❌ [ADMIN] Socket admin check error:", error);
        return next(new Error("Internal server error"));
    }
};

/**
 * Clear the admin cache (useful for testing or when admin list changes).
 */
const clearAdminCache = () => {
    adminCache.clear();
    console.log("🧹 [ADMIN] Cache cleared");
};

module.exports = { isAdmin, isAdminSocket, clearAdminCache };
