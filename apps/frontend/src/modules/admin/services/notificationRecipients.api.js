import api from '../../../shared/api/apiClient';

const NotificationRecipientsApi = {
  fetchAll: () => api.get('/api/notification-recipients').then((res) => res.data),
  create: (data) => api.post('/api/notification-recipients', data).then((res) => res.data),
  setActive: (id, active) =>
    api.patch(`/api/notification-recipients/${id}`, { active }).then((res) => res.data),
  remove: (id) => api.delete(`/api/notification-recipients/${id}`).then((res) => res.data),
};

export default NotificationRecipientsApi;
