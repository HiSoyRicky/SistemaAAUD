// server/routes/incidents/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getIncident = require('./getIncident');
const postIncident = require('./postIncident');
const updateIncident = require('./updateIncident');
const deleteIncident = require('./deleteIncident');
const getPublicIncident = require('./getPublicIncident');

// Usar las rutas
router.use(getIncident);
router.use(postIncident);
router.use(updateIncident);
router.use(deleteIncident);
router.use(getPublicIncident);

module.exports = router;