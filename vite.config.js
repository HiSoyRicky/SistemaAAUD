// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

module.exports = defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: API_URL,
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            '/socket.io': {
                target: API_URL,
                changeOrigin: true,
                ws: true,
            },
    },
}
});