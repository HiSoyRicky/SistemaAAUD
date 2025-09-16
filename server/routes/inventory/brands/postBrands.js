const express = require("express");
const router = express.Router();
const { pool } = require("../../../db/db"); // Ajusta según tu estructura

// POST nueva marca
router.post("/", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre es requerido" });

    try {
        const result = await pool.query(
            "INSERT INTO brands(name) VALUES($1) RETURNING *",
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al agregar marca" });
    }
});

module.exports = router;