// src/services/auth.js
const axios = require('axios');

async function login(username, password) {
    const response = await axios.post(`/api/login`, { username, password });
    return response.data;
};

function logout() {
    sessionStorage.clear();
};

module.exports = { login, logout };