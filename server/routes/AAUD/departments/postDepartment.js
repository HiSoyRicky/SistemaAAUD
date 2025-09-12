const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 POST crear departamento
router.post('/', async (req, res) => {
    const { name, id_ubication } = req.body;
    if (!name || !id_ubication) return res.status(400).json({ error: 'Campos requeridos' });

    try {
        const result = await pool.query(
            'INSERT INTO departments (name, id_ubication) VALUES ($1, $2) RETURNING id',
            [name, id_ubication]
        );
        res.json({ message: 'Departamento creado', created: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear departamento' });
    }
});

module.exports = router;