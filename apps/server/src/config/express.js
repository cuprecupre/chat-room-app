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

    app.use(
        express.static(clientBuildPath, {
            maxAge: "1y",
            immutable: true,
        })
    );

    return app;
}

module.exports = { createExpressApp };
