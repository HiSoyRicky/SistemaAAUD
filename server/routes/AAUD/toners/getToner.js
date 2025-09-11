const express = require("express");
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 Obtener todos los tóners con su modelo, color y estado
router.get("/", async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT  t.id,
                pm.name AS printer_model,
                tm.name AS toner_model,
                color.name AS color,
                t.stock,
                t.status,
                t.last_update
            FROM toners t
            INNER JOIN models pm ON t.id_printer_model = pm.id
            INNER JOIN toner_models tm ON t.id_toner_model = tm.id
            INNER JOIN toner_colors color ON t.id_color = color.id 
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/printer_models", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name FROM models");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/toner_models", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name FROM toner_models");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/colors", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name FROM toner_colors");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;