// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getDevices = require('./getDevices');
const updateDevices = require('./updateDevices');




// Usar las rutas
router.use(getDevices);
router.use(updateDevices);

module.exports = router;
