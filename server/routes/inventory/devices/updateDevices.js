// server/routes/devices.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db'); // Ajusta según tu conexión a PostgreSQL

// Actualizar dispositivo por id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    try {
        const result = await pool.query(
            'UPDATE devices SET name = $1 WHERE id = $2 RETURNING *',
            [name.trim(), id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }

        res.json({ message: 'Dispositivo actualizado correctamente', device: result.rows[0] });
    } catch (err) {
        console.error('Error al actualizar dispositivo:', err.message);
        res.status(500).json({ error: 'Error al actualizar dispositivo' });
    }
});

module.exports = router;
