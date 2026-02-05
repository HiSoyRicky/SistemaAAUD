// server/routes/AllRoutes.js
const express = require('express');
const router = express.Router();

//AAUD
const departmentsRouter = require('./AAUD/departments');
const ubicationsRouter = require('./AAUD/ubications');
const usersRouter = require('./users');
const tonersRouter = require('./AAUD/toners');
const documentsRouter = require('./AAUD/documents');

//Incidencias
const incidentsRouter = require('./incidents');

//Inventario
const inventoryRouter = require('./inventory');
const brandsRouter = require('./inventory/brands');
const devicesRouter = require('./inventory/devices');
const modelsRouter = require('./inventory/models');
const statusRouter = require('./AAUD/status');

// --- IMPORTANTE ---
// Aquí usas router.use en vez de app.use

//AAUD
router.use('/departments', departmentsRouter);
router.use('/ubications', ubicationsRouter);
router.use('/users', usersRouter);
router.use('/toners', tonersRouter);
router.use('/documents', documentsRouter);

//Incidencias
router.use('/incidents', incidentsRouter);

//Inventario
router.use('/inventory', inventoryRouter);
router.use('/brands', brandsRouter);
router.use('/devices', devicesRouter);
router.use('/models', modelsRouter);
router.use('/statuses', statusRouter);

module.exports = router;
