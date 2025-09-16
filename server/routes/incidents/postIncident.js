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
    if (isNaN(userIdNum) || !id_ubication || !id_department || !id_category || !description || !reporter_name) {
        return res.status(400).json({ error: 'Datos requeridos inválidos o faltantes' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const statusMap = { 'Pendiente': 1, 'En proceso': 2, 'Resuelto': 3 };
            const id_status = statusMap[status] || 1;

            const creationDate = createdAt ? new Date(createdAt) : new Date();
            if (isNaN(creationDate.getTime())) {
                return res.status(400).json({ error: 'Fecha de creación inválida' });
            }
            const solutionDate = solution_date ? new Date(solution_date) : null;
            if (solutionDate && isNaN(solutionDate.getTime())) {
                return res.status(400).json({ error: 'Fecha de solución inválida' });
            }

            // Valida FKs (ejemplo simple)
            const fkChecks = await Promise.all([
                client.query('SELECT id FROM users WHERE id = $1', [userIdNum]),
                client.query('SELECT id FROM ubications WHERE id = $1', [id_ubication]),
                client.query('SELECT id FROM departments WHERE id = $1', [id_department]),
                client.query('SELECT id FROM categories WHERE id = $1', [id_category])
            ]);
            if (fkChecks.some(result => result.rows.length === 0)) {
                throw new Error('ID de referencia inválido');
            }

            // Insertar incidencia y retornar id
            const insertResult = await pool.query(
                `INSERT INTO BD_Incidents
                    (id_user, reporter_name, email, id_ubication, id_department, description, id_category, other_category_detail, id_status, creation_date, solution_date, solution)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                RETURNING id;`,
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

            const fullIncidentResult = await client.query(`
                SELECT
                    i.id AS id_incident, i.id_user, i.reporter_name, i.email AS reporter_email,
                    u.name AS ubication_name, d.name AS department_name, c.name AS category_name,
                    i.description, i.id_category, i.other_category_detail, i.id_status,
                    i.creation_date, i.solution_date, i.solution,
                    t.nombre_completo AS technician_full_name, i.id_technician
                FROM BD_Incidents i
                LEFT JOIN users t ON i.id_technician = t.id
                LEFT JOIN ubications u ON i.id_ubication = u.id
                LEFT JOIN departments d ON i.id_department = d.id
                LEFT JOIN categories c ON i.id_category = c.id
                WHERE i.id = $1
            `, [insertedId]);

            const newIncident = fullIncidentResult.rows[0];

            await client.query('COMMIT');

            const { ubication_name, department_name, category_name } = newIncident;

            const token = generarTokenIncidencia(insertedId, email);
            const publicViewUrl = `${frontendUrl}/incidencias/view?token=${token}`;

            try {
                const formattedId = insertedId.toString().padStart(6, '0');
                await sendMail({
                    to: 'rvargas@aaud.gob.pa',
                    subject: `📥 Nueva incidencia registrada (#${formattedId})`,
                    html: `
                    <div style="
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f9f9f9;
                        padding: 20px;
                    ">
                        <div style="
                            max-width: 600px;
                            margin: auto;
                            background-color: #ffffff;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            border-top: 6px solid #2563eb;
                        ">
                            <h2 style="
                                color: #111827;
                                text-align: center;
                                margin-bottom: 20px;
                            ">Nueva incidencia registrada</h2>

                            <p style="font-size: 16px; color: #374151;">
                                Se ha registrado una nueva incidencia en el sistema.
                            </p>

                            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                                    <td style="padding: 8px;">${formattedId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                                    <td style="padding: 8px;">${reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${ubication_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${department_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${category_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${creationDate.toLocaleString('es-PA')}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${publicViewUrl}" style="
                                    display: inline-block;
                                    padding: 12px 25px;
                                    background-color: #2563eb;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    transition: background-color 0.3s ease;
                                " onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#2563eb'">
                                    Ver incidencia
                                </a>
                            </div>

                            <p style="font-size: 12px; color: #6b7280; text-align: center;">
                                Por favor, no responda a este correo. Este buzón no está monitoreado.<br/>
                                Para cualquier consulta, utilice el sistema de incidencias.<br/>
                                Gracias.
                            </p>
                        </div>
                    </div>
                    `
                });

                if (email) {
                    await sendMail({
                        to: email,
                        subject: `🕒 Confirmación de reporte de incidencia`,
                        html: `
                        <div style="
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f9f9f9;
                        padding: 20px;
                    ">
                        <div style="
                            max-width: 600px;
                            margin: auto;
                            background-color: #ffffff;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            border-top: 6px solid #2563eb;
                        ">
                            <h2 style="
                                color: #111827;
                                text-align: center;
                                margin-bottom: 20px;
                            ">Tu incidencia ha sido recibida</h2>

                            <p style="font-size: 16px; color: #374151;">
                                Pronto se te asignará un técnico para resolver tu incidencia.
                            </p>

                        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                                    <td style="padding: 8px;">${formattedId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                                    <td style="padding: 8px;">${reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${ubication_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${department_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${category_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${creationDate.toLocaleString('es-PA')}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${publicViewUrl}" style="
                                    display: inline-block;
                                    padding: 12px 25px;
                                    background-color: #2563eb;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    transition: background-color 0.3s ease;
                                " onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#2563eb'">
                                    Ver incidencia
                                </a>
                            </div>

                            <p style="font-size: 12px; color: #6b7280; text-align: center;">
                                Por favor, no responda a este correo. Este buzón no está monitoreado.<br/>
                                Para cualquier consulta, utilice el sistema de incidencias.<br/>
                                Gracias.
                            </p>
                        </div>
                    </div>
                    `
                    });
                }
            } catch (mailErr) {
                console.error('Error al enviar correo:', mailErr);
            }

            const io = req.app.get('io');
            io.emit('incidentCreated', newIncident);

            return res.json(newIncident);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error detallado:", err);
        res.status(500).json({ error: 'Error al crear incidencia' });
    }
});

module.exports = router;