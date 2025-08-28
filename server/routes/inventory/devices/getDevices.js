// server/routes/devices
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const pool = await getPoolDB();
        const result = await pool.request().query('SELECT id, name FROM devices ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener dispositivos' });
    }
});

module.exports = router;
