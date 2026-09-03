import api from '../../../shared/api/apiClient';

const Warehouse = {
  fetchItems: (params = {}) => api.get('/api/warehouse/items', { params }).then((res) => res.data),
  createItem: (data) => api.post('/api/warehouse/items', data).then((res) => res.data),
  updateItem: (id, data) => api.put(`/api/warehouse/items/${id}`, data).then((res) => res.data),
  fetchStock: (params = {}) => api.get('/api/warehouse/stock', { params }).then((res) => res.data),
  fetchMovements: (params = {}) =>
    api.get('/api/warehouse/movements', { params }).then((res) => res.data),
  createMovement: (data) => api.post('/api/warehouse/movements', data).then((res) => res.data),
  createBatchOut: (data) => api.post('/api/warehouse/movements/batch', data).then((res) => res.data),
  createBatchIn: (data) => api.post('/api/warehouse/movements/batch-in', data).then((res) => res.data),
  createBatchOut: (data) => api.post('/api/warehouse/movements/batch', data).then((res) => res.data),
  fetchUbications: () => api.get('/api/ubications').then((res) => res.data),
  fetchDepartments: () => api.get('/api/departments').then((res) => res.data),
};

export default Warehouse;
