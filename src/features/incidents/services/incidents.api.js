// incidents.api.js
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
  fetchAll: () => api.get("/api/incidents").then((res) => res.data),

  // Crear incidencia
  create: (payload) => api.post("/api/incidents", payload).then((res) => res.data),

  // Actualizar incidencia (PUT)
  update: (id, payload) => api.put(`/api/incidents/${id}`, payload).then((res) => res.data),

  // Eliminar incidencia (tu backend pide password en body)
  delete: (id, password) =>
    api.delete(`/api/incidents/${id}`, { data: { password } }).then((res) => res.data),

  // Helpers semánticos (opcional, pero más legible)
  assignTechnician: (id, technicianUsername) =>
    api.put(`/api/incidents/${id}`, { technician: technicianUsername, status: "Asignado" }).then((res) => res.data),

  resolve: (id, solutionText) =>
    api.put(`/api/incidents/${id}`, {
      status: "Resuelto",
      solution: solutionText,
      solution_date: new Date().toISOString(),
    }).then((res) => res.data),
};

// --- Usuarios ---
const Users = {
  fetchAll: () => api.get('/api/users').then(res => res.data),
  fetchRoles: () => api.get('/api/users/roles').then(res => res.data),

  fetchTechnicians: () => api.get("/api/users/technicians").then((res) => res.data),

  create: (user) => api.post('/api/users', user).then(res => res.data),
  update: (user) => api.put(`/api/users/${user.id}`, user).then(res => res.data),
  delete: (id) => api.delete(`/api/users/${id}`).then(res => res.data),
  updatePassword: (id, newPassword) => api.put(`/api/users/${id}/password`, { newPassword }).then(res => res.data),
};

export { Incidents, Users };
