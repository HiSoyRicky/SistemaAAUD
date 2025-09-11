// server/routes/AAUD/departments/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getDepartments = require('./getDepartments');
const postDepartment = require('./postDepartment');
const updateDepartment = require('./updateDepartment');
const deleteDepartment = require('./deleteDepartment');

// Usar las rutas
router.use(getDepartments);
router.use(updateDepartment);
router.use(deleteDepartment);
router.use(postDepartment);

module.exports = router;
