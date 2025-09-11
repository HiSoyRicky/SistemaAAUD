// server/routes/usuarios/updateUser.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db'); // tu pool de pg
const bcrypt = require('bcrypt');

// Actualizar un usuario
router.put('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { username, nombre_completo, email, id_rol, active } = req.body;

    if (isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });
    if (!username || !nombre_completo || !id_rol) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const query = `
            UPDATE users
            SET 
                username = $1,
                nombre_completo = $2,
                email = $3,
                id_rol = $4,
                active = $5
            WHERE id = $6
        `;
        const values = [username, nombre_completo, email || null, id_rol, active, userId];

        await pool.query(query, values);

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error('❌ Error al actualizar usuario:', err.message);
        res.status(500).json({ error: 'Error al actualizar usuario', details: err.message });
    }
});

// Actualizar la contraseña de un usuario
router.put('/:id/password', async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    console.log('ID usuario:', userId);
    console.log('Nueva contraseña recibida:', newPassword);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    if (!newPassword) {
        return res.status(400).json({ error: 'La nueva contraseña es requerida' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const query = 'UPDATE users SET password = $1 WHERE id = $2';
        const values = [hashedPassword, userId];

        await pool.query(query, values);

        console.log('Contraseña actualizada correctamente');

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('❌ Error al actualizar contraseña:', error.message);
        res.status(500).json({ error: 'Error al actualizar contraseña', details: error.message });
    }
});

module.exports = router;
