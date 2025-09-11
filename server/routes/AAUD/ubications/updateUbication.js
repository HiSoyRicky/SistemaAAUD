const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// PUT actualizar ubicación
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre inválido' });

    try {
        const result = await pool.query(
            'UPDATE ubications SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ubicación no encontrada' });
        }

        res.json({ message: 'Ubicación actualizada', updated: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error al actualizar ubicación' });
    }
});

module.exports = router;
