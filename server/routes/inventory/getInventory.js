// server/routes/inventory/getInventory.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');

router.get('/', async (req, res) => {
    const { search } = req.query;
    let params = [];

    let query = `
        SELECT 
            inv.id,
            inv.tag,
            inv."user",
            inv.serie,
            inv.ip,
            inv.transferdate,
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
        FROM BD_Inventory inv
        LEFT JOIN ubications ubi ON inv.id_ubication = ubi.id
        LEFT JOIN departments dep ON inv.id_department = dep.id
        LEFT JOIN devices dev ON inv.id_device = dev.id
        LEFT JOIN brands bra ON inv.id_brand = bra.id
        LEFT JOIN models mod ON inv.id_model = mod.id
        LEFT JOIN status sta ON inv.id_status = sta.id
    `;

    if (search) {
        query += `
            WHERE inv.serie ILIKE $1
            OR inv.tag ILIKE $1
            OR dev.name ILIKE $1
            OR bra.name ILIKE $1
            OR mod.name ILIKE $1
            OR dep.name ILIKE $1
            OR ubi.name ILIKE $1
            OR inv."user" ILIKE $1
        `;
        params.push(`%${search}%`);
    }

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener dispositivos:', err.message);
        res.status(500).json({ error: 'Error al obtener dispositivos', details: err.message });
    }
});

module.exports = router;
