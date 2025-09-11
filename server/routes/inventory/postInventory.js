// server/routes/inventory/postInventory.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');

router.post('/', async (req, res) => {
    const {
        tag,
        id_ubication,
        id_department,
        user,
        id_device,
        id_brand,
        id_model,
        serie,
        ip,
        id_status,
        transferdate,
        observation
    } = req.body;

    try {
        // Validar campos obligatorios
        if (!tag || !id_ubication || !id_department || !id_device || !id_brand || !id_model || !serie || !id_status) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        // Si no mandan fecha → usar la actual
        const transferDateObj = transferdate || new Date();

        const query = `
            INSERT INTO bd_inventory
                (
                tag, 
                id_ubication, 
                id_department,
                "user", 
                id_device,
                id_brand, 
                id_model, 
                serie, 
                ip, 
                id_status, 
                transferdate, 
                observation
                )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;

        const values = [
            tag,
            parseInt(id_ubication),
            parseInt(id_department),
            user || null,
            parseInt(id_device),
            parseInt(id_brand),
            parseInt(id_model),
            serie,
            ip || null,
            parseInt(id_status),
            transferDateObj,
            observation || null
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Dispositivo creado exitosamente',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error('Error al crear dispositivo:', err);
        res.status(500).json({
            success: false,
            message: 'Error al crear el dispositivo',
            error: err.message
        });
    }
});

module.exports = router;