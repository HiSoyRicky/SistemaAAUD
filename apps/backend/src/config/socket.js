import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function initSocket(server) {

    const io = new Server(server, {
        cors: {
            origin: env.FRONTEND_URL
        }
    });

    io.use((socket, next) => {
        
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("No autorizado"));
        }

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);

            socket.user = {
                id: decoded.id,
                role: decoded.role
            };

            next();

        } catch {
            next(new Error("Token inválido"));
        }
    });

    io.on("connection", (socket) => {

        const userId = socket.user.id;

        socket.join(`user_${userId}`);

        socket.on("joinIncidentRoom", (id) => {
            socket.join(`incident_${id}`);
        });

    });

    return io;
}