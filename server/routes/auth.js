const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db/db');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'clave_super_secreta';

router.post('/register', async (req, res) => {
    const { username, password, nombre_completo, id_rol } = req.body;

    if (!username || !password || !nombre_completo || !id_rol) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Chequea si rol existe
        const rolExists = await pool.query('SELECT id FROM roles WHERE id = $1', [id_rol]);
        if (rolExists.rows.length === 0) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        // Verificar si el usuario ya existe
        const existeQuery = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existeQuery.rows.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar en la base de datos
        await pool.query(
            `INSERT INTO users (username, password, nombre_completo, id_rol, active)
             VALUES ($1, $2, $3, $4, 1)`,
            [username, hashedPassword, nombre_completo, id_rol]
        );

        res.json({ mensaje: 'Usuario registrado exitosamente', usuario: newUser.rows[0] });
    } catch (err) {
        console.error('❌ Error al registrar:', err.message);
        res.status(500).json({ error: 'Error al registrar' });
    }
});

// Endpoint para autenticar usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const result = await pool.query(
            'SELECT id, nombre_completo, id_rol, password FROM users WHERE username = $1 AND active = 1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }

        const user = result.rows[0];
        // Comparar password con bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Genera JWT
        const token = jwt.sign({ id: user.id, rol: user.id_rol }, secretKey, { expiresIn: '1h' });

        // Login exitoso, devolver datos sin la contraseña
        const { password: _, ...userWithoutPassword } = user;
        res.json({ mensaje: 'Login exitoso', usuario: userWithoutPassword, token });
    } catch (err) {
        console.error('Error al autenticar usuario:', err);
        res.status(500).json({ error: 'Error del servidor'});
    }
});

module.exports = router;