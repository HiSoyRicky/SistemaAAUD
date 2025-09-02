//server/routes/inventory/getInventory.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../db/db');

router.get('/', async (req, res) => {
    const { search } = req.query;
    const pool = await getPoolDB();

    let query = `
        SELECT 
            inv.id,
            inv.tag,
            inv.[user] AS [user],
            inv.serie,
            inv.ip,
            inv.transferDate,
            inv.observation,

            ubi.id AS id_ubication,
            ubi.name AS ubication_name,

            dep.id AS id_department,
            dep.name AS department_name,

            dev.id AS id_device,
            dev.name AS device_name,

            bra.id AS id_brand,
            bra.name AS brand_name,

            mod.id AS id_model,
            mod.name AS model_name,

            sta.id AS id_status,
            sta.name AS status_name
        FROM SistemaAAUD.dbo.BD_Inventory inv
        LEFT JOIN ubications ubi ON inv.id_ubication = ubi.id
        LEFT JOIN departments dep ON inv.id_department = dep.id
        LEFT JOIN devices dev ON inv.id_device = dev.id
        LEFT JOIN brands bra ON inv.id_brand = bra.id
        LEFT JOIN models mod ON inv.id_model = mod.id
        LEFT JOIN status sta ON inv.id_status = sta.id
    `;

    if (search) {
        query += `
            WHERE inv.serie LIKE @s
            OR inv.tag LIKE @s
            OR dev.name LIKE @s
            OR bra.name LIKE @s
            OR mod.name LIKE @s
            OR dep.name LIKE @s
            OR ubi.name LIKE @s
            OR inv.[user] LIKE @s
        `;
    }

    try {
        const request = pool.request();

        if (search) {
            request.input('s', `%${search}%`);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener dispositivos' });
    }
});

module.exports = router;
