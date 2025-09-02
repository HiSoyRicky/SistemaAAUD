const express = require("express");
const router = express.Router();
const { getPoolDB } = require('../../../db/db');

// 🔹 Agregar movimiento (entrada/salida)
router.post("/movement", async (req, res) => {
    const { id_toner, movement_type, quantity, user_id, notes } = req.body;
    try {
        const pool = await getPoolDB();

        // Insertamos el movimiento
        await pool.request()
            .input("id_toner", sql.Int, id_toner)
            .input("movement_type", sql.NVarChar, movement_type)
            .input("quantity", sql.Int, quantity)
            .input("user_id", sql.Int, user_id)
            .input("notes", sql.NVarChar, notes)
            .query(`
                INSERT INTO toner_movements (id_toner, movement_type, quantity, user_id, notes)
                VALUES (@id_toner, @movement_type, @quantity, @user_id, @notes)
            `);

        // Actualizamos stock en toners
        const factor = movement_type === "Entrada" ? 1 : -1;
        await pool.request()
            .input("id_toner", sql.Int, id_toner)
            .input("quantity", sql.Int, quantity * factor)
            .query(`
                UPDATE toners SET stock = stock + @quantity, last_update = GETDATE()
                WHERE id = @id_toner
            `);

        res.json({ message: "Movimiento registrado y stock actualizado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;