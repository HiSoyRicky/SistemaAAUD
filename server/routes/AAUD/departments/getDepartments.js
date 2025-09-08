// server/routes/departamentos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT id, name, id_ubication, id_direction
            FROM departments
            ORDER BY name
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener departamentos:', error.message);
        res.status(500).json({ error: 'Error al obtener departamentos', details: error.message });
    }
});

module.exports = router;