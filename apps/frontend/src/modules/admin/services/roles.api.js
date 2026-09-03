import api from '../../../shared/api/apiClient';

const RolesApi = {
  fetchAll: () => api.get('/api/roles').then((res) => res.data),
  create: (data) => api.post('/api/roles', data).then((res) => res.data),
  update: (id, data) => api.put(`/api/roles/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/api/roles/${id}`).then((res) => res.data),
};

export default RolesApi;