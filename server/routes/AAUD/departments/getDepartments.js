// server/routes/departamentos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT 
            d.id, 
            d.name, 
            d.id_ubication, 
            u.name AS ubication_name
            FROM departments d
            LEFT JOIN ubications u ON d.id_ubication = u.id
            ORDER BY d.id
    `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener departamentos:', error.message);
        res.status(500).json({ error: 'Error al obtener departamentos', details: error.message });
    }
});

module.exports = router;