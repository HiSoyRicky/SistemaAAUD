// apiClient.js

import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

let handlingUnauthorized = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED'
    ) {
      window.location.href = '/cambiar-contraseña';
    }

    if (error.response?.status === 401) {
      if (handlingUnauthorized) {
        return Promise.reject(error);
      }

      handlingUnauthorized = true;

      localStorage.removeItem('token');

      window.location.href = '/login?expired=true';

      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;
