const express = require("express");
const router = express.Router();
const { pool } = require("../../../db/db"); // Ajusta según tu estructura

// PUT actualizar marca
router.put("/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    if (!name) return res.status(400).json({ error: "Nombre es requerido" });

    try {
        const result = await pool.query(
            "UPDATE brands SET name=$1 WHERE id=$2 RETURNING *",
            [name, id]
        );
        if (result.rowCount === 0)
            return res.status(404).json({ error: "Marca no encontrada" });

        res.json({ message: "Marca actualizada correctamente", brand: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar marca" });
    }
});

module.exports = router;
