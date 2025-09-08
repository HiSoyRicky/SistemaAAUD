// server/routes/devices
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        
        const result = await pool.query('SELECT id, name FROM devices ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener dispositivos' });
    }
});

module.exports = router;
