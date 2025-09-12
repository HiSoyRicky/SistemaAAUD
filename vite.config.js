// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

module.exports = defineConfig({
    plugins: [react()],
    base: '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
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