// server/routes/brands
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const pool = await getPoolDB();
        const result = await pool.request().query(`
            SELECT id, name, id_brand, id_device 
            FROM models 
            ORDER BY name
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener modelos' });
    }
});

module.exports = router;
