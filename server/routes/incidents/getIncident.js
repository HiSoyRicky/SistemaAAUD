// server/routes/incidencias/getIncident.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');

// Endpoint para obtener todas las incidencias
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                i.id AS id_incident,
                i.id_user,
                i.reporter_name,
                i.email AS reporter_email,
                u.name AS ubication_name,
                d.name AS department_name,
                i.description,
                i.id_category,
                i.other_category_detail,
                i.id_status,
                i.creation_date,
                i.solution_date,
                i.solution,  
                t.nombre_completo AS technician_full_name,
                i.id_technician
            FROM
                BD_Incidents i
            LEFT JOIN users t ON i.id_technician = t.id
            LEFT JOIN ubications u ON i.id_ubication = u.id
            LEFT JOIN departments d ON i.id_department = d.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error en la conexión SQL:', err.message);
        res.status(500).json({ error: 'Error en la conexión PostgreSQL', details: err.message });
    }
});

// Endpoint para obtener incidencia por id
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    try {
        const result = await pool.query(`
                SELECT
                    i.id AS id_incident,
                    i.reporter_name,
                    i.email AS reporter_email,
                    u.name AS ubication_name,
                    d.name AS department_name,
                    c.name AS category_name,
                    i.description,
                    i.other_category_detail,
                    i.creation_date,
                    i.solution,
                    i.solution_date,
                    i.id_status,
                    CASE i.id_status
                        WHEN 1 THEN 'Pendiente'
                        WHEN 2 THEN 'Asignado a un técnico'
                        WHEN 3 THEN 'Resuelto'
                        ELSE 'Desconocido'
                    END AS status
                FROM incident i
                JOIN ubication u ON i.id_ubication = u.id
                JOIN department d ON i.id_department = d.id
                JOIN category c ON i.id_category = c.id
                WHERE i.id = $1
             `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener incidencia:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;