// server/routes/inventory/updateInventory.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../db/db');

async function getId(pool, table, name, fieldName) {
    if (!name) throw new Error(`${fieldName} es obligatorio`);
    const result = await pool.request()
        .input('name', name)
        .query(`SELECT id FROM ${table} WHERE name = @name`);

    if (!result.recordset[0]) {
        throw new Error(`${fieldName} "${name}" no existe en la base de datos`);
    }
    return result.recordset[0].id;
}

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
        transferDate,
        observation
    } = req.body;

    try {
        const pool = await getPoolDB();

        // Preparar la query de actualización
        const query = `
            UPDATE BD_Inventory
            SET 
                tag = @tag,
                id_ubication = @id_ubication,
                id_department = @id_department,
                [user] = @user,
                id_device = @id_device,
                id_brand = @id_brand,
                id_model = @id_model,
                serie = @serie,
                ip = @ip,
                id_status = @id_status,
                transferDate = @transferDate,
                observation = @observation
            WHERE id = @id
        `;

        const request = pool.request();
        request.input('id', id);
        request.input('tag', tag);
        request.input('id_ubication', id_ubication);
        request.input('id_department', id_department);
        request.input('user', user || '');
        request.input('id_device', id_device);
        request.input('id_brand', id_brand);
        request.input('id_model', id_model);
        request.input('serie', serie);
        request.input('ip', ip || '');
        request.input('id_status', id_status);
        request.input('transferDate', transferDate ? new Date(transferDate) : null);
        request.input('observation', observation || null);

        await request.query(query);
        res.json({ message: 'Equipo actualizado correctamente' });

    } catch (err) {
        console.error('Error en UPDATE Inventario:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;