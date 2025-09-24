// server/routes/inventory/status/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getStatus = require('./getStatus');
const updateStatus = require('./updateStatus');
const postStatus = require('./postStatus');





// Usar las rutas
router.use(getStatus);
router.use(updateStatus);
router.use(postStatus);

module.exports = router;
