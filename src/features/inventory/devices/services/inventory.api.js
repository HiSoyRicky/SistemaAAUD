// api.js
import api from "@/shared/api/apiClient";

// --- Inventario ---
const Inventory = {
  fetchDeviceTypes: () => api.get('/api/devices').then(res => res.data),
  fetchDevices: (search = '') => api.get('/api/inventory', { params: { search } }).then(res => res.data),
  addDevice: (data) => api.post('/api/inventory', data).then(res => res.data),
  updateDevice: (id, data) => api.put(`/api/inventory/${id}`, data).then(res => res.data),
  deleteDevice: (id) => api.delete(`/api/inventory/${id}`).then(res => res.data),
  fetchBrands: () => api.get('/api/brands').then(res => res.data),
  fetchModels: () => api.get('/api/models').then(res => res.data),
  fetchStatuses: () => api.get('/api/status').then(res => res.data),
};

// --- Usuarios ---
const Users = {
  fetchAll: () => api.get('/api/users').then(res => res.data),
  fetchRoles: () => api.get('/api/users/roles').then(res => res.data),
  create: (user) => api.post('/api/users', user).then(res => res.data),
  update: (user) => api.put(`/api/users/${user.id}`, user).then(res => res.data),
  delete: (id) => api.delete(`/api/users/${id}`).then(res => res.data),
  updatePassword: (id, newPassword, options = {}) =>
    api.put(`/api/users/${id}/password`, { newPassword, ...options }).then(res => res.data),
};

// --- Departamentos ---
const Departments = {
  fetchAll: () => api.get('/api/departments').then(res => res.data),
  create: (data) => api.post('/api/departments', data).then(res => res.data),
  update: (id, data) => api.put(`/api/departments/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/departments/${id}`).then(res => res.data),
  authorize: (id, password) => api.post(`/api/departments/${id}/authorize`, { password }).then(res => res.data),
};

export { Users, Inventory, Departments };
