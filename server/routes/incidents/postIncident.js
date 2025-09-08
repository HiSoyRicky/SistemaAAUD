// server/routes/incidents/postIncident.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const sendMail = require('../../utils/mailer');
const { generarTokenIncidencia } = require('../../utils/token');
const frontendUrl = process.env.FRONTEND_BASE_URL;

router.post('/', async (req, res) => {
    const {
        id_user,
        email,
        id_ubication,
        id_department,
        description,
        id_category,
        other_category_detail,
        status,
        solution,
        solution_date,
        createdAt,
        reporter_name
    } = req.body;

    const userIdNum = parseInt(id_user, 10);
    if (isNaN(userIdNum)) {
        return res.status(400).json({ error: 'id_user debe ser un número válido' });
    }

    try {

        const statusMap = {
            'Pendiente': 1,
            'En proceso': 2,
            'Resuelto': 3
        };

        const id_status = statusMap[status] || 1;

        const creationDate = createdAt ? new Date(createdAt) : new Date();
        if (isNaN(creationDate)) {
            return res.status(400).json({ error: 'Fecha de creación inválida' });
        }
        const solutionDate = solution_date ? new Date(solution_date) : null;
        if (solutionDate && isNaN(solutionDate)) {
            return res.status(400).json({ error: 'Fecha de solución inválida' });
        }

        // Insertar incidencia y retornar id
        const insertResult = await pool.query(
            `INSERT INTO BD_Incidents
        (id_user, reporter_name, email, id_ubication, id_department, description, id_category, other_category_detail, id_status, creation_date, solution_date, solution)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING bd_incidents.id;`,
            [
                id_user,
                reporter_name,
                email || null,
                id_ubication,
                id_department,
                description,
                id_category,
                other_category_detail || null,
                id_status,
                creationDate,
                solutionDate || null,
                solution || ''
            ]
        );

        const insertedId = insertResult.rows[0].id;

        const newIncidentResult = await pool.query(`
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
                FROM BD_Incidents i
                LEFT JOIN users t ON i.id_technician = t.id
                LEFT JOIN ubications u ON i.id_ubication = u.id
                LEFT JOIN departments d ON i.id_department = d.id
                WHERE i.id = $1
            `, [insertedId]);

        const newIncident = newIncidentResult.rows[0];

        const metaResult = await pool.query(`
                SELECT u.name AS ubication_name, d.name AS department_name, c.name AS category_name
                FROM BD_Incidents i
                JOIN ubications u ON i.id_ubication = u.id
                JOIN departments d ON i.id_department = d.id
                JOIN categories c ON i.id_category = c.id
                WHERE i.id = $1
            `, [insertedId]);

        const { ubication_name, department_name, category_name } = metaResult.rows[0];

        const token = generarTokenIncidencia(insertedId, email);
        const publicViewUrl = `${frontendUrl}/incidencias/view?token=${token}`;

        try {
            const formattedId = insertedId.toString().padStart(6, '0');
            await sendMail({
                to: 'rvargas@aaud.gob.pa',
                subject: `📥 Nueva incidencia registrada (#${formattedId})`,
                html: `
                    <h3>Se ha registrado una nueva incidencia</h3>
                    <p><strong>Incidencia N°:</strong> ${formattedId}</p>
                    <p><strong>Reportado por:</strong> ${reporter_name}</p>
                    <p><strong>Ubicación:</strong> ${ubication_name}</p>
                    <p><strong>Departamento:</strong> ${department_name}</p>
                    <p><strong>Categoría:</strong> ${category_name}</p>
                    <p><strong>Otra categoría:</strong> ${other_category_detail || 'N/A'}</p>
                    <p><strong>Descripción:</strong> ${description}</p>
                    <p><strong>Fecha de creación:</strong> ${creationDate.toLocaleString('es-PA')}</p>
                    <p>Sistema de Incidencias AAUD</p>
                    <p>
                        <a href="${publicViewUrl}" style="
                            display: inline-block;
                            padding: 10px 15px;
                            background-color: #2563eb;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                        ">Ver incidencia</a>
                    </p>
                    <p style="font-size: 0.8em; color: #666;">
                    Por favor, no responda a este correo. Este buzón no está monitoreado.<br/>
                    Para cualquier consulta, utilice el sistema de incidencias.<br/>
                    Gracias.
                    </p>
                `
            });

            if (email) {
                await sendMail({
                    to: email,
                    subject: `🕒 Confirmación de reporte de incidencia`,
                    html: `
                        <h3>Tu incidencia ha sido recibida correctamente.</h3>
                        <p>Pronto se te asignará un técnico para resolver tu incidencia.</p>
                        <p><strong>Incidencia N°:</strong> ${formattedId}</p>
                        <p><strong>Reportado por:</strong> ${reporter_name}</p>
                        <p><strong>Ubicación:</strong> ${ubication_name}</p>
                        <p><strong>Departamento:</strong> ${department_name}</p>
                        <p><strong>Categoría:</strong> ${category_name}</p>
                        <p><strong>Otra categoría:</strong> ${other_category_detail || 'N/A'}</p>
                        <p><strong>Descripción:</strong> ${description}</p>
                        <p>Sistema de Incidencias AAUD</p>
                        <p>
                            <a href="${publicViewUrl}" style="
                                display: inline-block;
                                padding: 10px 15px;
                                background-color: #2563eb;
                                color: white;
                                text-decoration: none;
                                border-radius: 5px;
                            ">Ver incidencia</a>
                        </p>
                        <p style="font-size: 0.8em; color: #666;">
                        Por favor, no responda a este correo. Este buzón no está monitoreado.<br/>
                        Para cualquier consulta, utilice el sistema de incidencias.<br/>
                        Gracias.
                        </p>
                    `
                });
            }
        } catch (mailErr) {
            console.error('Error al enviar correo:', mailErr);
        }

        const io = req.app.get('io');
        io.emit('incidentCreated', newIncident);

        return res.json({
            ...newIncident,
            ubication_name,
            department_name,
            category_name
        });
    } catch (err) {
        console.error("Error detallado:", err);
        res.status(500).json({ error: 'Error al crear incidencia', details: err.message });
    }
});

module.exports = router;