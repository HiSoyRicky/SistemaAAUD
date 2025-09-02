const express = require("express");
const router = express.Router();
const { getPoolDB } = require('../../../db/db');

// 🔹 Obtener todos los tóners con su modelo, color y estado
router.get("/", async (req, res) => {
    try {
        const pool = await getPoolDB();
        const result = await pool.request().query(`
            SELECT  t.id,
                    d.device_name,
                    m.model,
                    c.name AS color, 
                    t.stock, 
                    t.status,
                    t.last_update
            FROM toners t
            INNER JOIN devices d ON t.id_device = d.id_device
            INNER JOIN toner_model m ON t.id_toner_model = m.id
            INNER JOIN toner_colors c ON t.id_color = c.id_color
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;