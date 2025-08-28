// server/routes/usuarios/deleteUser.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../db/db');
const sql = require('mssql');

// Eliminar un usuario
router.delete('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    try {
        const pool = await getPoolDB();
        await pool.request()
            .input('id', sql.Int, userId)
            .query('UPDATE users SET active = 0 WHERE id = @id');

        res.json({ message: 'Usuario desactivado correctamente' });
    } catch (err) {
        console.error('❌ Error al desactivar usuario:', err.message);
        res.status(500).json({ error: 'Error al desactivar usuario', details: err.message });
    }
});

module.exports = router;