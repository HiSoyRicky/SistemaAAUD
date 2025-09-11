const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');

// 🔹 DELETE eliminar departamento
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM department WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Departamento no encontrado' });
        res.json({ message: 'Departamento eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar departamento' });
    }
});

module.exports = router;
