const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');

const secretKey = process.env.JWT_SECRET || 'clave_super_secreta';

// Generar token para acceso público a una incidencia
function generarTokenIncidencia(id, email) {
    const payload = {
        id,
        email,
        type: 'incident'
    };
    // Válido por 730 horas (30 días)
    return jwt.sign(payload, secretKey, { expiresIn: '730h' });
}

// Validar token y obtener incidencia
async function getIncidentByToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        const { id, email } = decoded;

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
                s.name AS status  -- Asumiendo join con status table
            FROM BD_Incidents i
            JOIN ubications u ON i.id_ubication = u.id
            JOIN departments d ON i.id_department = d.id
            JOIN categories c ON i.id_category = c.id
            JOIN status s ON i.id_status = s.id  -- Reemplaza CASE
            WHERE i.id = $1 AND i.email = $2
        `, [id, email]);

        if (result.rows.length === 0) {
            console.log('No incident found for id:', id, 'and email:', email);
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