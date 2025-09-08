// server/utils/token.js
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { getPoolDB } = require('../db/db');
const e = require('express');

const secretKey = process.env.JWT_SECRET || 'clave_super_secreta';

// Generar token para acceso público a una incidencia
function generarTokenIncidencia(id, email) {
    const payload = {
        id,
        email
    };
    // Válido por 730 horas (30 días)
    return jwt.sign(payload, secretKey, { expiresIn: '730h' });
}

// Validar token y obtener incidencia
async function getIncidentByToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        const { id, email } = decoded;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT
                    i.id,
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
                FROM BD_Incidents i
                JOIN ubications u ON i.id_ubication = u.id
                JOIN departments d ON i.id_department = d.id
                JOIN categories c ON i.id_category = c.id
                WHERE i.id = @id AND i.email = @email
            `);

        if (result.recordset.length === 0) {
            console.log('No incident found for id:', id, 'and email:', email);
            return null;
        }

        return result.recordset[0];
    } catch (err) {
        console.error('Error validating token:', err);
        throw err;
    }
}

module.exports = { generarTokenIncidencia, getIncidentByToken };