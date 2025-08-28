// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getModels = require('./getModels');





// Usar las rutas
router.use(getModels);

module.exports = router;
