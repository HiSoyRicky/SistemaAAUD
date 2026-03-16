// socketClient.js
import { io } from "socket.io-client";

const socketUrl =
    import.meta.env.VITE_SOCKET_URL || window.location.origin;

const socket = io(socketUrl, {
    autoConnect: false,
    transports: ["websocket"],
});

export const connectSocket = (token) => {
    if (!socket.connected) {
        socket.auth = { token };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export const subscribe = (event, callback) => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
};

export const emitEvent = (event, payload) => {
    if (!socket.connected) {
        console.warn("Socket no conectado");
        return;
    }
    socket.emit(event, payload);
};

export const onConnectionEvents = () => {
    socket.on("connect", () => {
        console.log("Socket conectado:", socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.warn("Socket desconectado:", reason);
    });

    socket.on("connect_error", (err) => {
        console.error("Error de conexión:", err.message);
    });
};

export { socket };