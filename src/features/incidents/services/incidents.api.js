// api.js
import axios from 'axios';
import { API_BASE_URL } from '@/shared/config/apiBaseUrl';

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

// --- Usuarios ---
const Users = {
  fetchAll: () => api.get('/api/users').then(res => res.data),
  fetchRoles: () => api.get('/api/users/roles').then(res => res.data),
  create: (user) => api.post('/api/users', user).then(res => res.data),
  update: (user) => api.put(`/api/users/${user.id}`, user).then(res => res.data),
  delete: (id) => api.delete(`/api/users/${id}`).then(res => res.data),
  updatePassword: (id, newPassword) => api.put(`/api/users/${id}/password`, { newPassword }).then(res => res.data),
};

export { Incidents, Users };
