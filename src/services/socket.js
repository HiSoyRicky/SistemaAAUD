// src/services/socket.js

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

const socket = io(API_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
    if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export const onIncidentCreated = (callback) => {
    socket.on('incidentCreated', callback);
};

export const onIncidentUpdated = (callback) => {
    socket.on('incidentUpdated', callback);
};

export const onIncidentDeleted = (callback) => {
    socket.on('incidentDeleted', callback);
};

export const joinIncidentRoom = (id_incident) => {
    socket.emit('joinIncidentRoom', id_incident);
    console.log(`Unido a la sala de incidencia: incident_${id_incident}`);
};

export const leaveIncidentRoom = (id_incident) => {
    socket.emit('leaveIncidentRoom', id_incident);
    console.log(`Abandonada la sala de incidencia: incident_${id_incident}`);
};

export { socket };