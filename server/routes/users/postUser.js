// server/routes/usuarios/postUser.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db'); // tu pool de pg
const bcrypt = require('bcrypt');

// Crear un nuevo usuario
router.post('/', async (req, res) => {
    const { username, password, nombre_completo, id_rol, email } = req.body;

    if (!username || !password || !nombre_completo || !id_rol) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password, email, nombre_completo, id_rol, active)
            VALUES ($1, $2, $3, $4, $5, true)
        `;
        const values = [username, hashedPassword, email || null, nombre_completo, id_rol];

        await pool.query(query, values);

        res.json({ message: 'Usuario creado correctamente' });
    } catch (err) {
        console.error('❌ Error al crear usuario:', err.message);
        res.status(500).json({ error: 'Error al crear usuario', details: err.message });
    }
});

module.exports = router;
