// server/routes/AAUD/departments/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getDepartments = require('./getDepartments');





// Usar las rutas
router.use(getDepartments);






module.exports = router;
