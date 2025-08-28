// src/services/socket.js

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

const socket = io(API_URL, {
    autoConnect: false, // Conectar manualmente
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
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

export const joinIncidentRoom = (incidentId) => {
    socket.emit('joinIncidentRoom', incidentId);
    console.log(`Unido a la sala de incidencia: incident_${incidentId}`);
};

export const leaveIncidentRoom = (incidentId) => {
    socket.emit('leaveIncidentRoom', incidentId);
    console.log(`Abandonada la sala de incidencia: incident_${incidentId}`);
};

export { socket };