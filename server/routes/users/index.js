// server/routes/usuarios/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const postUser = require('./postUser');
const getUsers = require('./getUsers');
const updateUsers = require('./updateUser');
const deleteUsers = require('./deleteUser');

// Usar las rutas
router.use('/', postUser);
router.use('/', getUsers);
router.use('/', updateUsers);
router.use('/', deleteUsers);

module.exports = router;
