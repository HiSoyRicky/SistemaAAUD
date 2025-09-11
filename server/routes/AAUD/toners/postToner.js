const express = require("express");
const router = express.Router();
const { pool } = require("../../../db/db");

// 🔹 Crear tóner
router.post("/", async (req, res) => {
    const { id_printer_model, id_toner_model, id_color, stock, status } = req.body;

    if (!id_printer_model || !id_toner_model || !id_color) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO toners (id_printer_model, id_toner_model, id_color, stock, status, last_update)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING id`,
            [id_printer_model, id_toner_model, id_color, stock || 0, status || 'Disponible']
        );
        res.json({ id: result.rows[0].id, message: "Tóner creado correctamente" });
    } catch (err) {
        console.error("Error al crear tóner:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Crear modelo de tóner
router.post("/toner_models", async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "El nombre es requerido" });
    }

    try {
        // ⚠️ No incluimos ID, PostgreSQL lo genera automáticamente
        const result = await pool.query(
            `INSERT INTO toner_models (name) 
             VALUES ($1) 
             RETURNING id, name`,
            [name.trim()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error al crear modelo de tóner:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
