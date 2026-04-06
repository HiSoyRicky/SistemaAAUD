import api from '../../../shared/api/apiClient';

const Activity = {
  fetchLogs: (params = {}) =>
    api.get('/api/activity', { params }).then((res) => res.data)
};

export { Activity };
