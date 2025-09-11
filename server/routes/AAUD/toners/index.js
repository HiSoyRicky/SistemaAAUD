// server/routes/AAUD/toners/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getToner = require('./getToner');
const postToner = require('./postToner');
const updateToner = require('./updateToner');

// Usar las rutas
router.use(getToner);
router.use(postToner);
router.use(updateToner);

module.exports = router;
