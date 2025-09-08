// server/routes/inventory/updateInventory.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');

router.put('/:id', async (req, res) => {
    const { id } = req.params;
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

    // Validaciones básicas
    if (isNaN(parseInt(id))) return res.status(400).json({ error: 'ID inválido' });
    if (id_ubication && isNaN(parseInt(id_ubication))) return res.status(400).json({ error: 'Ubicación inválida' });
    if (id_department && isNaN(parseInt(id_department))) return res.status(400).json({ error: 'Departamento inválido' });
    if (id_device && isNaN(parseInt(id_device))) return res.status(400).json({ error: 'Dispositivo inválido' });
    if (id_brand && isNaN(parseInt(id_brand))) return res.status(400).json({ error: 'Marca inválida' });
    if (id_model && isNaN(parseInt(id_model))) return res.status(400).json({ error: 'Modelo inválido' });
    if (id_status && isNaN(parseInt(id_status))) return res.status(400).json({ error: 'Estado inválido' });

    try {

        // Preparar la query de actualización
        const query = `
            UPDATE BD_Inventory
            SET 
                tag = $1,
                id_ubication = $2,
                id_department = $3,
                "user" = $4,
                id_device = $5,
                id_brand = $6,
                id_model = $7,
                serie = $8,
                ip = $9,
                id_status = $10,
                "transferdate" = $11,
                observation = $12
            WHERE id = $13
            RETURNING *;
        `;

        const values = [
            tag ?? null,
            id_ubication ?? null,
            id_department ?? null,
            user ?? null,
            id_device ?? null,
            id_brand ?? null,
            id_model ?? null,
            serie ?? null,
            ip ?? null,
            id_status ?? null,
            transferdate || null,
            observation ?? null,
            id
        ];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No se encontró el equipo con el ID proporcionado' });
        }

        res.json({ message: 'Equipo actualizado correctamente', updatedItem: result.rows[0] });
    } catch (err) {
        console.error('Error en UPDATE Inventario:', err);
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
});

module.exports = router;