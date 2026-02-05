const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getDocuments = require('./getDocuments');
const postDocuments = require('./postDocuments');
const updateDocuments = require('./updateDocuments');
const deleteDocuments = require('./deleteDocuments');

// Usar las rutas
router.use(getDocuments);
router.use(updateDocuments);
router.use(deleteDocuments);
router.use(postDocuments);

module.exports = router;