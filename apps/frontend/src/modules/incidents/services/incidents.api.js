// incidents.api.js
import api from "../../../shared/api/apiClient";

// --- Incidencias ---
const Incidents = {
  fetchAll: () => api.get("/api/incidents").then((res) => res.data),

  // Crear incidencia
  create: (payload) => api.post("/api/incidents", payload).then((res) => res.data),

  // Actualizar incidencia (PUT)
  update: (id, payload) => api.put(`/api/incidents/${id}`, payload).then((res) => res.data),

  // Helpers semánticos (opcional, pero más legible)
  assignTechnician: (id, technicianId) =>
    api.put(`/api/incidents/${id}`, {
      id_technician: technicianId,
      id_status: 2
    })
      .then((res) => res.data),

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
  updatePassword: (id, newPassword, options = {}) =>
    api.put(`/api/users/${id}/password`, { newPassword, ...options }).then(res => res.data),
};

export { Incidents, Users };
