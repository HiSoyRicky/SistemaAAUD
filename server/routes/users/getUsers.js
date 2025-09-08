// server/routes/usuarios/getUsers.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
            id, 
            nombre_completo AS full_name, 
            username, 
            email, 
            id_rol, 
            active
            FROM users
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener usuarios:', err.message);
        res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
    }
});

router.get('/technicians', async (req, res) => {
    try {
        
        const result = await pool.query(`
            SELECT id, username, nombre_completo
            FROM users
            WHERE id_rol = 2 AND active = 1
    `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener técnicos:', err.message);
        res.status(500).json({ error: 'Error al obtener técnicos', details: err.message });
    }
});

// Obtener todos los roles
router.get('/roles', async (req, res) => {
    try {
        
        const result = await pool.query(`
            SELECT id, name AS role_name
            FROM roles
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener roles:', err.message);
        res.status(500).json({ error: 'Error al obtener roles', details: err.message });
    }
});

module.exports = router;