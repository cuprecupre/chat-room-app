import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/__tests__/setup.js"],
        include: ["src/**/*.{test,spec}.{js,jsx}"],
        // CI optimizations
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 1000,
        isolate: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/", "src/__tests__/setup.js"],
        },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:3000",
                changeOrigin: true,
                ws: true,
            },
        },
    },
});
