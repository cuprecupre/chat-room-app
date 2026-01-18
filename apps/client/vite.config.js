import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor chunks for better caching
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
                    "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
                    "vendor-motion": ["framer-motion"],
                    "vendor-ui": ["lucide-react", "react-hot-toast"],
                },
            },
        },
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Increase chunk size warning limit (vendor chunks are expected to be larger)
        chunkSizeWarningLimit: 600,
    },
    test: {
        globals: true,
        environment: "happy-dom",
        setupFiles: ["./src/__tests__/setup.js"],
        include: ["src/**/*.{test,spec}.{js,jsx}"],
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
