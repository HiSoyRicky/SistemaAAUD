// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getDevices = require('./getDevices');





// Usar las rutas
router.use(getDevices);

module.exports = router;
