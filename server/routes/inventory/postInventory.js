// server/routes/inventory/postInventory.js
const express = require('express');
const router = express.Router();


router.post('/', async (req, res) => {
    const {
        tag,
        id_ubication,
        id_direction,
        id_deparment,
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
        

        const transferDateObj = transferdate ? new Date(transferdate) : new Date();

        const result = await pool.request()
            .input('tag', sql.NVarChar, tag)
            .input('id_ubication', sql.Int, id_ubication)
            .input('id_direction', sql.Int, id_direction)
            .input('id_deparment', sql.Int, id_deparment)
            .input('user', sql.NVarChar, user)
            .input('id_device', sql.Int, id_device)
            .input('id_brand', sql.Int, id_brand)
            .input('id_model', sql.Int, id_model)
            .input('serie', sql.NVarChar, serie)
            .input('ip', sql.NVarChar, ip)
            .input('id_status', sql.Int, id_status)
            .input('transferdate', sql.DateTime, transferDateObj)
            .input('observation', sql.NVarChar, observation || '')
            .query(`
                INSERT INTO inventory
                (tag, id_ubication, id_direction, id_deparment, [user], id_device, id_brand, id_model, serie, ip, id_status, transferdate, observation)
                OUTPUT INSERTED.id
                VALUES (@tag, @id_ubication, @id_direction, @id_deparment, @user, @id_device, @id_brand, @id_model, @serie, @ip, @id_status, @transferdate, @observation)
            `);

        const insertedId = result.rows[0].id;

        res.status(201).json({
            success: true,
            message: 'Dispositivo creado exitosamente',
            id: insertedId
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