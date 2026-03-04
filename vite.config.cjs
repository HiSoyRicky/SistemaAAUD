// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(() => {

    const API_URL = "http://localhost:3000";

    return {
        plugins: [react(), visualizer({ open: false })],
        base: "/",
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            host: true,
            port: 5173,
            proxy: {
                "/api": {
                    target: API_URL,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
                "/socket.io": {
                    target: API_URL,
                    changeOrigin: true,
                    ws: true,
                },
                "/uploads": {
                    target: API_URL,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        build: {
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        react: ["react", "react-dom"],
                        ui: ["lucide-react", "react-router-dom", "axios", "recharts"],
                    },
                },
            },
        },
    };
});
