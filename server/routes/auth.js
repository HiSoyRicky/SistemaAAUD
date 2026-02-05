const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db/db');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { tr } = require('zod/v4/locales');

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(8).required(),
    nombre_completo: Joi.string().min(3).max(100).required(),
    id_rol: Joi.number().integer().min(1).required()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

router.post('/register', async (req, res) => {
    try {
        // Validar datos con Joi
        await registerSchema.validateAsync(req.body, { abortEarly: false });

        const { username, password, nombre_completo, id_rol } = req.body;

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
        const newUser = await pool.query(
            `INSERT INTO users (username, password, nombre_completo, id_rol, active)
                VALUES ($1, $2, $3, $4, 1)
                RETURNING id, username, nombre_completo, id_rol, active`,
            [username, hashedPassword, nombre_completo, id_rol]
        );

        res.json({ mensaje: "Usuario registrado exitosamente", usuario: newUser.rows[0] });

    } catch (err) {
        if (err.isJoi) {
            // Error de validación Joi
            return res.status(400).json({ error: err.details.map(d => d.message).join(', ') });
        }
        console.error('❌ Error al registrar:', err.message);
        res.status(500).json({ error: 'Error al registrar' });
    }
});

// Endpoint para autenticar usuario
router.post('/login', async (req, res) => {
    try {
        // Validar datos con Joi
        await loginSchema.validateAsync(req.body, { abortEarly: false });

        const { username, password } = req.body;

        const result = await pool.query(
            `SELECT u.id, u.username, u.nombre_completo, u.id_rol, r.name AS role_name, u.password
                FROM users u
                JOIN roles r ON r.id = u.id_rol
                WHERE u.username = $1 AND u.active = 1`,
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
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                rol: user.id_rol,
                roleId: user.id_rol,
                role_name: user.role_name
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Login exitoso, devolver datos sin la contraseña
        const { password: _, ...userWithoutPassword } = user;
        res.json({ mensaje: 'Login exitoso', usuario: userWithoutPassword, token });
    } catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.details.map(d => d.message).join(', ') });
        }
        console.error('Error al autenticar usuario:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;