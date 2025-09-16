// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getModels = require('./getModels');
const updateModels = require('./updateModels');
const postModels = require('./postModels');




// Usar las rutas
router.use(getModels);
router.use(updateModels);
router.use(postModels);

module.exports = router;
