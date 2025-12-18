const express = require("express");
const fs = require("fs");
const path = require("path");

const clientDist = path.join(__dirname, "..", "..", "..", "client", "dist");

/**
 * Create and configure Express application.
 */
function createExpressApp() {
    const app = express();

    // Serve og.png with no-cache for social media scrapers
    app.get("/og.png", (req, res) => {
        const ogPath = path.join(clientDist, "og.png");
        if (!fs.existsSync(ogPath)) return res.status(404).end();
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.type("png");
        res.sendFile(ogPath);
    });

    // Configure cache for static assets
    app.use(
        express.static(clientDist, {
            maxAge: "1y",
            etag: true,
            lastModified: true,
            setHeaders: (res, filePath) => {
                if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
                    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                }
                if (filePath.match(/\.(css|js)$/)) {
                    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                }
                if (filePath.match(/\.html$/)) {
                    res.setHeader("Cache-Control", "public, max-age=3600");
                }
            },
        })
    );

    // CORS for API endpoints in development
    app.use("/api", (req, res, next) => {
        const origin = req.headers.origin;
        if (process.env.NODE_ENV !== "production") {
            if (
                !origin ||
                origin.includes("localhost") ||
                /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)
            ) {
                res.header("Access-Control-Allow-Origin", origin || "*");
                res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
            }
        }
        next();
    });

    return app;
}

/**
 * Setup SPA fallback with OG meta tag injection.
 * Must be called after API routes are registered.
 */
function setupSpaFallback(app) {
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/socket.io/")) return next();

        const indexPath = path.join(clientDist, "index.html");
        if (!fs.existsSync(indexPath)) {
            return res
                .status(500)
                .send(
                    'Client build not found. Run "npm run build" inside the apps/client/ folder.'
                );
        }

        try {
            const raw = fs.readFileSync(indexPath, "utf8");
            const host = req.get("x-forwarded-host") || req.get("host");
            const proto = req.get("x-forwarded-proto") || req.protocol || "https";
            const baseUrl = `${proto}://${host}`;
            const absoluteOg = `${baseUrl}/og.png`;
            const absoluteFav = `${baseUrl}/favicon.png`;

            let html = raw
                .replace(/(property=\"og:image\"\s+content=)\"[^\"]*\"/g, `$1"${absoluteOg}"`)
                .replace(/(name=\"twitter:image\"\s+content=)\"[^\"]*\"/g, `$1"${absoluteOg}"`)
                .replace(/(rel=\"icon\"[^>]*href=)\"[^\"]*\"/g, `$1"${absoluteFav}"`);

            // Ensure og:image:secure_url
            if (/property=\"og:image:secure_url\"/.test(html)) {
                html = html.replace(
                    /(property=\"og:image:secure_url\"\s+content=)\"[^\"]*\"/g,
                    `$1"${absoluteOg}"`
                );
            } else {
                const secureTag = `\n    <meta property=\"og:image:secure_url\" content=\"${absoluteOg}\" />`;
                html = html.replace(/<title>[\s\S]*?<\/title>/, (m) => `${m}${secureTag}`);
            }

            // Ensure og:url present
            if (!/property=\"og:url\"/.test(html)) {
                const injectTag = `\n    <meta property="og:url" content="${baseUrl}${req.originalUrl}" />`;
                html = html.replace(/<title>[\s\S]*?<\/title>/, (m) => `${m}${injectTag}`);
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.send(html);
        } catch (e) {
            res.sendFile(indexPath);
        }
    });
}

module.exports = { createExpressApp, setupSpaFallback };
