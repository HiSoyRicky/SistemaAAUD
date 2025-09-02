// server/routes/AAUD/ubications/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getUbications = require('./getUbications');





// Usar las rutas
router.use(getUbications);


module.exports = router;
