// server/routes/incidencias/deleteIncidencia.js
const express = require('express');
const router = express.Router();
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { pool } = require('../../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Endpoint para eliminar una incidencia
router.delete('/:id', verifyToken, catchAsync(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { password } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña demasiado corta' });

    // Verificar la contraseña del usuario

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const userResult = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT password_hash FROM users WHERE id = @userId');

    if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const storedHash = userResult.rows[0].password_hash;

    const passwordMatch = await bcrypt.compare(password, storedHash);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM BD_Incidents WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    const io = req.app.get('io');
    io.emit('incidentDeleted', { id });

    res.json({ message: 'Incidencia eliminada' });

}));

module.exports = router;