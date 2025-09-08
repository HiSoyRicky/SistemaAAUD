// server/routes/usuarios/updateUser.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
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
        
        await pool.request()
            .input('id', sql.Int, userId)
            .input('username', sql.NVarChar, username)
            .input('nombre_completo', sql.NVarChar, nombre_completo)
            .input('email', sql.NVarChar, email)
            .input('id_rol', sql.Int, id_rol)
            .input('active', sql.Bit, active)
            .query(`
                UPDATE users
                SET 
                    username = @username, 
                    nombre_completo = @nombre_completo,
                    email = @email, 
                    id_rol = @id_rol, 
                    active = @active
                WHERE id = @id
            `);

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

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    if (!newPassword) {
        return res.status(400).json({ error: 'La nueva contraseña es requerida' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.request()
            .input('id', sql.Int, userId)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE users SET password = @password WHERE id = @id');

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('❌ Error al actualizar contraseña:', error.message);
        res.status(500).json({ error: 'Error al actualizar contraseña', details: error.message });
    }
});



module.exports = router;