const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 POST: Crear un nuevo estado
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del estado es requerido' });

    try {
        const result = await pool.query(
            'INSERT INTO status (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear estado:', err.message);
        res.status(500).json({ error: 'Error al crear estado', details: err.message });
    }
});

module.exports = router;