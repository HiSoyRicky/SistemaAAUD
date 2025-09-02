// server/routes/AAUD/toners/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getToner = require('./getToner');
const postToner = require('./postToner');

// Usar las rutas
router.use(getToner);
router.use(postToner);

module.exports = router;
