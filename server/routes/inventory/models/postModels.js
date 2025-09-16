const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 Crear un nuevo modelo
router.post('/', async (req, res) => {
    const { name, id_brand, id_device } = req.body;

    if (!name || !id_brand || !id_device) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO models (name, id_brand, id_device)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, id_brand, id_device]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear modelo' });
    }
});

module.exports = router;
