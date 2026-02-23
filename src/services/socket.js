// socket.js

import { io } from "socket.io-client";

const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (typeof window !== "undefined" ? window.location.origin : undefined);

const socket = io(socketUrl, {
    autoConnect: false,
    transports: ["websocket", "polling"],
});

export const connectSocket = (userId) => {
    if (!socket.connected) {
        socket.auth = { userId };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export const onIncidentCreated = (callback) => {
    socket.on("incidentCreated", callback);
    return () => socket.off("incidentCreated", callback);
};

export const onIncidentUpdated = (callback) => {
    socket.on("incidentUpdated", callback);
    return () => socket.off("incidentUpdated", callback);
};

export const onIncidentDeleted = (callback) => {
    socket.on("incidentDeleted", callback);
    return () => socket.off("incidentDeleted", callback);
};

export const joinIncidentRoom = (id_incident) => {
    socket.emit("joinIncidentRoom", id_incident);
    console.log(`Unido a la sala de incidencia: incident_${id_incident}`);
};

export const leaveIncidentRoom = (id_incident) => {
    socket.emit("leaveIncidentRoom", id_incident);
    // console.log(`Abandonada la sala de incidencia: incident_${id_incident}`);
};

export { socket };
