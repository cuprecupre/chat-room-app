const express = require("express");
const cors = require("cors");
const compression = require("compression");
const path = require("path");

function createExpressApp() {
    const app = express();

    // Enable gzip compression for all responses
    // This reduces JS/CSS transfer size by ~60%
    app.use(compression());

    app.use(express.json());
    app.use("/api", cors());

    // Serve static files from the client build directory
    // Relative path: from apps/server/src/config/express.js -> apps/client/dist
    const clientBuildPath = path.join(__dirname, "../../../client/dist");

    // Regla especial para index.html: NO cachear nunca
    // Esto asegura que los usuarios siempre obtengan la última versión
    app.get("/", (req, res, next) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        next();
    });

    // Assets con hash (JS, CSS, imágenes): cache agresivo de 1 año
    // Vite genera hashes únicos, así que cuando cambia el código, cambia el nombre del archivo
    app.use(
        express.static(clientBuildPath, {
            maxAge: "1y",
            immutable: true,
            setHeaders: (res, filePath) => {
                // index.html nunca debe cachearse
                if (filePath.endsWith("index.html")) {
                    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                }
            },
        })
    );

    return app;
}

module.exports = { createExpressApp };
