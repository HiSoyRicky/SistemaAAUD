// src/services/api.js
import axios from 'axios';

// Configuración de la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configuración inicial de axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor para auth
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token'); // Asumiendo storage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- Incidencias ---
const Incidents = {
    fetchAll: () => api.get('/api/incidents').then(res => res.data),
};

// --- Inventario ---
const Inventory = {
    fetchDevices: (search = '') => api.get('/api/inventory', { params: { search } }).then(res => res.data),
    addDevice: (data) => api.post('/api/inventory', data).then(res => res.data),
    updateDevice: (id, data) => api.put(`/api/inventory/${id}`, data).then(res => res.data),
    deleteDevice: (id) => api.delete(`/api/inventory/${id}`).then(res => res.data),
    fetchBrands: () => api.get('/api/brands').then(res => res.data),
    fetchModels: () => api.get('/api/models').then(res => res.data),
    fetchStatuses: () => api.get('/api/statuses').then(res => res.data),
};

// --- Toners ---
const Toners = {
    fetchAll: () => api.get('/api/toners').then(res => res.data),
    fetchPrinterModels: () => api.get('/api/toners/printer_models').then(res => res.data),
    fetchTonerModels: () => api.get('/api/toners/toner_models').then(res => res.data),
    createTonerModel: (data) => api.post('/api/toners/toner_models', data).then(res => res.data),
    fetchColors: () => api.get('/api/toners/colors').then(res => res.data),
    create: (data) => api.post('/api/toners', data).then(res => res.data),
    update: (id, data) => api.put(`/api/toners/${id}`, data).then(res => res.data),
    // delete: ... (si lo necesitas)
    addMovement: (data) => api.post('/api/toners/movement', data).then(res => res.data),
};

// --- Usuarios ---
const Users = {
    fetchAll: () => api.get('/api/users').then(res => res.data),
    fetchRoles: () => api.get('/api/users/roles').then(res => res.data),
    create: (user) => api.post('/api/users', user).then(res => res.data),
    update: (user) => api.put(`/api/users/${user.id}`, user).then(res => res.data),
    delete: (id) => api.delete(`/api/users/${id}`).then(res => res.data),
    updatePassword: (id, newPassword) =>
        api.put(`/api/users/${id}/password`, { newPassword }).then(res => res.data),
};

export { Incidents, Users, Inventory, Toners };