// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getBrands = require('./getBrands');
const postBrands = require('./postBrands');
const updateBrands = require('./updateBrands');


// Usar las rutas
router.use(getBrands);
router.use(postBrands);
router.use(updateBrands);

module.exports = router;
