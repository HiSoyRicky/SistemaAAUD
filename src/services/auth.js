// src/services/auth.js
const axios = require('axios');
const API_URL = process.env.VITE_API_URL;

async function login(username, password) {
    const response = await axios.post(`${API_URL}/api/login`, { username, password });
    return response.data;
};

function logout() {
    sessionStorage.clear();
};

module.exports = { login, logout };