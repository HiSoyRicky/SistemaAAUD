const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 Actualizar un modelo existente
router.put('/:id', async (req, res) => {
    const modelId = parseInt(req.params.id, 10);
    const { name, id_brand, id_device } = req.body;

    if (isNaN(modelId)) {
        return res.status(400).json({ error: 'ID de modelo inválido' });
    }

    if (!name || !id_brand || !id_device) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const result = await pool.query(`
            UPDATE models
            SET name = $1, id_brand = $2, id_device = $3
            WHERE id = $4
            RETURNING *
        `, [name, id_brand, id_device, modelId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Modelo no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar modelo' });
    }
});

module.exports = router;
