// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getDevices = require('./getDevices');
const updateDevices = require('./updateDevices');
const postDevices = require('./postDevices');
const deleteDevices = require('./deleteDevices');


// Usar las rutas
router.use(getDevices);
router.use(updateDevices);
router.use(deleteDevices);
router.use(postDevices);

module.exports = router;
