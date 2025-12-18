const express = require("express");
const cors = require("cors");

function createExpressApp() {
    const app = express();
    app.use(express.json());
    app.use("/api", cors());
    return app;
}

module.exports = { createExpressApp };
