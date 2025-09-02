// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { getPoolDB } = require('../db/db');
const sql = require('mssql'); // ✅ Faltaba esto
const bcrypt = require('bcrypt');


router.post('/register', async (req, res) => {
    const { username, password, nombre_completo, id_rol } = req.body;

    if (!username || !password || !nombre_completo || !id_rol) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
        const pool = await getPoolDB();

        // Verificar si el usuario ya existe
        const existe = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id FROM users WHERE username = @username');

        if (existe.recordset.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar en la base de datos
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('nombre_completo', sql.NVarChar, nombre_completo)
            .input('id_rol', sql.Int, id_rol)
            .input('active', sql.Int, 1)
            .query(`
                INSERT INTO users (username, password, nombre_completo, id_rol, active)
                VALUES (@username, @password, @nombre_completo, @id_rol, @active)
            `);

        res.json({ mensaje: 'Usuario registrado exitosamente' });
    } catch (err) {
        console.error('❌ Error al registrar:', err.message);
        res.status(500).json({ error: 'Error al registrar', details: err.message });
    }
});

// Endpoint para autenticar usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const pool = await getPoolDB();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id, nombre_completo, id_rol, password FROM users WHERE username = @username AND active = 1');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        const user = result.recordset[0];

        // Comparar password con bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Login exitoso, devolver datos sin la contraseña
        const { password: _, ...userWithoutPassword } = user;
        res.json({ mensaje: 'Login exitoso', usuario: userWithoutPassword });

    } catch (err) {
        console.error('Error al autenticar usuario:', err);
        res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
});

module.exports = router;