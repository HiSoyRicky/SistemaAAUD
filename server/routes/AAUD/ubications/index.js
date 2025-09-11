// server/routes/AAUD/ubications/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getUbications = require('./getUbications');
const updateUbication = require('./updateUbication');



// Usar las rutas
router.use(getUbications);
router.use(updateUbication);


module.exports = router;
