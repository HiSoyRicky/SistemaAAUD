const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');

const secretKey = process.env.JWT_SECRET;

function generarTokenIncidencia(id, email) {
    const payload = { id, email, type: 'incident' };
    return jwt.sign(payload, secretKey, { expiresIn: '730h' }); // 30 días
}

async function getIncidentByToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        const { id /*, email*/ } = decoded;

        const result = await pool.query(`
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
                s.name AS status,
                i.id_technician,
                t.nombre_completo AS technician_full_name,
                t.email AS technician_email
            FROM bd_incidents i
            LEFT JOIN ubications u ON i.id_ubication = u.id
            LEFT JOIN departments d ON i.id_department = d.id
            LEFT JOIN categories c ON i.id_category = c.id
            LEFT JOIN status s ON i.id_status = s.id
            LEFT JOIN users t ON i.id_technician = t.id
            WHERE i.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            console.log('No incident found for id:', id);
            return null;
        }

        return result.rows[0];
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        }
        console.error('Error validating token:', err);
        throw err;
    }
}

module.exports = { generarTokenIncidencia, getIncidentByToken };
