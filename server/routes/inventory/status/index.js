// server/routes/inventory/status/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getStatus = require('./getStatus');





// Usar las rutas
router.use(getStatus);

module.exports = router;
