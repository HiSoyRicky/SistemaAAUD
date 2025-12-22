// src/services/auth.js
const axios = require('axios');
import { API_BASE_URL } from '../shared/config/apiBaseUrl.js';

async function login(username, password) {
    const response = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
    return response.data;
};

function logout() {
    sessionStorage.clear();
};

module.exports = { login, logout };