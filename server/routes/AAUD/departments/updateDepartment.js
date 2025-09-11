const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 PUT actualizar departamento
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, id_ubication } = req.body;
    if (!name || !id_ubication) return res.status(400).json({ error: 'Campos requeridos' });

    try {
        const result = await pool.query(
            'UPDATE department SET name = $1, id_ubication = $2 WHERE id = $3 RETURNING *',
            [name, id_ubication, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Departamento no encontrado' });

        res.json({ message: 'Departamento actualizado', updated: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar departamento' });
    }
});

module.exports = router;
