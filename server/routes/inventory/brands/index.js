// server/routes/inventory/brands/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getBrands = require('./getBrands');





// Usar las rutas
router.use(getBrands);

module.exports = router;
