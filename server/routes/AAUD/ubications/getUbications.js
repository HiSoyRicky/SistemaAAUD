// server/routes/departamentos.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const pool = await getPoolDB();
        const result = await pool.request().query(`
            SELECT id, name
            FROM ubications
            ORDER BY name
    `);
        res.json(result.recordset);
    } catch (error) {
        console.error('❌ Error al obtener ubicaciones:', error.message);
        res.status(500).json({ error: 'Error al obtener ubicaciones', details: error.message });
    }
});

module.exports = router;