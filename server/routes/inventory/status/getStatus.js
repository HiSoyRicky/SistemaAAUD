// server/routes/inventory/status/getStatus.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const pool = await getPoolDB();
        const result = await pool.request().query(`
            SELECT id, name
            FROM status
            ORDER BY name
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los estados' });
    }
});

module.exports = router;