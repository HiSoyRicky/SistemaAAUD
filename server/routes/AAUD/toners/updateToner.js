const express = require("express");
const router = express.Router();
const { pool } = require("../../../db/db");

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query(`
            UPDATE toners 
            SET status = $1, last_update = NOW() 
            WHERE id = $2
        `, [status, id]);
        res.json({ message: "Tóner actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar tóner:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;