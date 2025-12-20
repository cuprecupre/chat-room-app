const express = require("express");
const cors = require("cors");
const path = require("path");

function createExpressApp() {
    const app = express();
    app.use(express.json());
    app.use("/api", cors());

    // Serve static files from the client build directory
    // Relative path: from apps/server/src/config/express.js -> apps/client/dist
    const clientBuildPath = path.join(__dirname, "../../../client/dist");

    app.use(express.static(clientBuildPath));

    return app;
}

module.exports = { createExpressApp };
