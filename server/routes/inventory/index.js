// server/routes/inventory/index.js
const express = require('express');
const router = express.Router();

// Importar rutas específicas
const getInventory = require('./getInventory');
const postInventory = require('./postInventory');
const updateInventory = require('./updateInventory');




// Usar las rutas
router.use(getInventory);
router.use(postInventory);
router.use(updateInventory);





module.exports = router;
