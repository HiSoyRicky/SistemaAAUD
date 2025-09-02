// server/routes/usuarios/postUser.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../../db/db');
const bcrypt = require('bcrypt');
const sql = require('mssql');

// Crear un nuevo usuario
router.post('/', async (req, res) => {
    const { username, password, nombre_completo, id_rol, email } = req.body;

    if (!username || !password || !nombre_completo || !id_rol) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pool = await getPoolDB();
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('email', sql.NVarChar, email)
            .input('nombre_completo', sql.NVarChar, nombre_completo)
            .input('id_rol', sql.Int, id_rol)
            .query(`
                INSERT INTO users (username, password, email, nombre_completo, id_rol, active)
                VALUES (@username, @password, @email, @nombre_completo, @id_rol, 1)
            `);

        res.json({ message: 'Usuario creado correctamente' });
    } catch (err) {
        console.error('❌ Error al crear usuario:', err.message);
        res.status(500).json({ error: 'Error al crear usuario', details: err.message });
    }
});

module.exports = router;