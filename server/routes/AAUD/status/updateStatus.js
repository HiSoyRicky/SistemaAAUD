const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 PUT: Actualizar un estado existente
router.put('/:id', async (req, res) => {
    const statusId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(statusId)) return res.status(400).json({ error: 'ID de estado inválido' });
    if (!name) return res.status(400).json({ error: 'El nombre del estado es requerido' });

    try {
        const result = await pool.query(
            'UPDATE status SET name = $1 WHERE id = $2 RETURNING *',
            [name, statusId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Estado no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar estado:', err.message);
        res.status(500).json({ error: 'Error al actualizar estado', details: err.message });
    }
});

module.exports = router;