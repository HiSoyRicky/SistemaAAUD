import api from '../../../shared/api/apiClient';

const PermissionsApi = {
  fetchOverview: () => api.get('/api/permissions').then((res) => res.data),

  fetchRolePermissions: (roleId) =>
    api.get(`/api/permissions/roles/${roleId}`).then((res) => res.data),

  updateRolePermissions: (roleId, permissions) =>
    api
      .put(`/api/permissions/roles/${roleId}`, { permissions })
      .then((res) => res.data),

  fetchUserPermissions: (userId) =>
    api.get(`/api/permissions/users/${userId}`).then((res) => res.data),

  updateUserPermissions: (userId, payload) =>
    api.put(`/api/permissions/users/${userId}`, payload).then((res) => res.data),

  fetchUsers: () => api.get('/api/users').then((res) => res.data)
};

export default PermissionsApi;
