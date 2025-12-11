// /api.js
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl.js';

// Configuración inicial de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptores ---
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=true';
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
  fetchDeviceTypes: () => api.get('/api/devices').then(res => res.data),
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
  create: (data) => api.post('/api/toners', data).then(res => res.data),
  update: (id, data) => api.put(`/api/toners/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/toners/${id}`).then(res => res.data),
  addMovement: (data) => api.post('/api/toners/movement', data).then(res => res.data),
};

// --- Usuarios ---
const Users = {
  fetchAll: () => api.get('/api/users').then(res => res.data),
  fetchRoles: () => api.get('/api/users/roles').then(res => res.data),
  create: (user) => api.post('/api/users', user).then(res => res.data),
  update: (user) => api.put(`/api/users/${user.id}`, user).then(res => res.data),
  delete: (id) => api.delete(`/api/users/${id}`).then(res => res.data),
  updatePassword: (id, newPassword) => api.put(`/api/users/${id}/password`, { newPassword }).then(res => res.data),
};

// --- Departamentos ---
const Departments = {
  fetchAll: () => api.get('/api/departments').then(res => res.data),
  create: (data) => api.post('/api/departments', data).then(res => res.data),
  update: (id, data) => api.put(`/api/departments/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/departments/${id}`).then(res => res.data),
  authorize: (id, password) => api.post(`/api/departments/${id}/authorize`, { password }).then(res => res.data),
};

export { Incidents, Users, Inventory, Toners, Departments };
