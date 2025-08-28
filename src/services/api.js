// src/services/api.js
import axios from 'axios';

// Configuración de la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configuración inicial de axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

//Incidencias

// Obtener todas las incidencias
export async function fetchIncidences() {
    const response = await api.get('/api/incidents');
    return response.data;
}



//Inventario

// Obtener dispositivos de inventario con búsqueda opcional
export async function fetchDevice(search = '') {
    const response = await api.get('/api/inventory', {
        params: { search }
    });
    return response.data;
}

// Agregar un nuevo dispositivo
export async function addDevice(data) {
    const response = await api.post('/api/inventory', data);
    return response.data;
}

// Editar un dispositivo
export async function updateDevice(id, data) {
    const response = await api.put(`/api/inventory/${id}`, data);
    return response.data;
}

// (Opcional) Eliminar un dispositivo
export async function deleteDevice(id) {
    const response = await api.delete(`/api/inventory/${id}`);
    return response.data;
}

//Usuarios
export async function fetchUsers() {
    const res = await api.get(`/api/users`);
    return res.data;
}

export async function postUser(user) {
    const res = await api.post(`/api/users`, user);
    return res.data;
}

export async function updateUser(user) {
    const res = await api.put(`/api/users/${user.id}`, user);
    return res.data;
}

export async function deleteUser(id) {
    const res = await api.delete(`/api/users/${id}`);
    return res.data;
}

export async function fetchRoles() {
    const res = await api.get(`/api/users/roles`);
    return res.data;
}

export async function fetchBrands() {
    const res = await api.get(`/api/brands`);
    return res.data;
}

export async function fetchDevices() {
    const res = await api.get(`/api/devices`);
    return res.data;
}

export async function fetchModels() {
    const res = await api.get(`/api/models`);
    return res.data;
}

export async function fetchStatuses() {
    const res = await api.get(`/api/statuses`);
    return res.data;
}