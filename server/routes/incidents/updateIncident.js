// server/routes/incidencias/updateIncidencia.js

const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const sendMail = require('../../utils/mailer');
const { generarTokenIncidencia } = require('../../utils/token');
const frontendUrl = process.env.FRONTEND_BASE_URL;

// Endpoint para actualizar una incidencia
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { description, category, status, solution, solution_date, technician, silent } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    try {
        // 1. Ver incidencia actual
        const currentIncidenceResult = await pool.query(
            'SELECT id_status, email, reporter_name FROM bd_incidents WHERE id = $1',
            [id]
        );
        if (currentIncidenceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada' });
        }
        const currentStatus = currentIncidenceResult.rows[0].id_status;
        const reporterEmail = currentIncidenceResult.rows[0].email;
        const reporterName = currentIncidenceResult.rows[0].reporter_name;

        // 2. Buscar técnico si lo enviaron
        let id_technician = null;
        if (technician) {
            const techResult = await pool.query(
                'SELECT id FROM users WHERE username = $1 AND id_rol = 2 AND active = 1',
                [technician]
            );
            if (techResult.rows.length === 0) {
                return res.status(400).json({ error: 'Técnico no encontrado o no activo' });
            }
            id_technician = techResult.rows[0].id;
        }

        // 3. Mapear status a id_status
        const id_status = status === 'Pendiente' ? 1 : status === 'Asignado' ? 2 : 3;

        // 4. Construir query dinámicamente
        const updates = [];
        const values = [];
        let index = 1;

        if (description !== undefined) {
            updates.push(`description = $${index++}`);
            values.push(description);
        }
        if (category !== undefined) {
            updates.push(`id_category = $${index++}`);
            values.push(category);
        }
        if (id_technician !== null) {
            updates.push(`id_technician = $${index++}`);
            values.push(id_technician);
        }
        if (id_status !== undefined) {
            updates.push(`id_status = $${index++}`);
            values.push(id_status);
        }
        if (solution !== undefined) {
            updates.push(`solution = $${index++}`);
            values.push(solution);
        }
        if (solution_date !== undefined) {
            const dateValue = solution_date && solution_date.trim() !== '' ? new Date(solution_date) : null;
            updates.push(`solution_date = $${index++}`);
            values.push(dateValue);
        }


        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        values.push(id); // último valor para WHERE
        const query = `UPDATE bd_incidents SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
        await pool.query(query, values);

        // 5. Obtener incidencia actualizada
        const updatedIncidentResult = await pool.query(`
                SELECT
                    i.id,
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
                FROM bd_incidents i
                LEFT JOIN users t ON i.id_technician = t.id
                LEFT JOIN ubications u ON i.id_ubication = u.id
                LEFT JOIN departments d ON i.id_department = d.id
                WHERE i.id = $1
        `, [id]);

        if (updatedIncidentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada después de actualizar' });
        }

        const updatedIncident = updatedIncidentResult.rows[0];

        // 6. Enviar correo al técnico asignado
        if (id_technician && !silent) {
            const techInfoResult = await pool.query(`
                    SELECT 
                        u.nombre_completo AS technician_name,
                        u.email AS technician_email,
                        i.description,
                        i.creation_date,
                        i.id,
                        i.reporter_name,
                        i.other_category_detail
                    FROM users u
                    JOIN bd_incidents i ON i.id_technician = u.id
                    WHERE i.id = $1 AND u.id = $2
            `, [id, id_technician]);

            const techInfo = techInfoResult.rows[0];

            if (techInfo && techInfo.technician_email) {
                const metaResult = await pool.query(`
                    SELECT
                        u.name AS ubication_name, 
                        d.name AS department_name, 
                        c.name AS category_name
                    FROM bd_incidents i
                        JOIN ubications u ON i.id_ubication = u.id
                        JOIN departments d ON i.id_department = d.id
                        JOIN categories c ON i.id_category = c.id
                        WHERE i.id = $1
                `, [id]);

                if (metaResult.rows.length === 0) {
                    console.error('No se encontraron metadatos para la incidencia:', id);
                    return res.status(500).json({ error: 'No se encontraron metadatos para la incidencia' });
                }

                const { ubication_name, department_name, category_name } = metaResult.rows[0];

                const formattedId = id.toString().padStart(6, '0');
                const privateViewUrl = `${frontendUrl}/incidencias/${formattedId}`;
                await sendMail({
                    to: techInfo.technician_email,
                    subject: `🔧 Nueva incidencia asignada (#${formattedId})`,
                    html: `
                        <h3>Hola ${techInfo.technician_name}, se te ha asignado una nueva incidencia:</h3>
                        <p><strong>Incidencia N°:</strong> ${formattedId}</p>
                        <p><strong>Reportado por:</strong> ${techInfo.reporter_name}</p>
                        <p><strong>Ubicación:</strong> ${ubication_name}</p>
                        <p><strong>Departamento:</strong> ${department_name}</p>
                        <p><strong>Categoría:</strong> ${category_name}</p>
                        <p><strong>Otra categoría:</strong> ${techInfo.other_category_detail || 'N/A'}</p>
                        <p><strong>Descripción:</strong> ${techInfo.description}</p>
                        <p><strong>Fecha de creación:</strong> ${new Date(techInfo.creation_date).toLocaleString('es-PA')}</p>
                        <p>Sistema de Incidencias AAUD</p>
                        <p>
                            <a href="${privateViewUrl}" style="
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
        }

        // 7. Enviar correo al reportero si se resolvió
        if (currentStatus !== 3 && id_status === 3 && reporterEmail && !silent) {
            const metaResult = await pool.query(`
                SELECT
                    u.name AS ubication_name, 
                    d.name AS department_name, 
                    c.name AS category_name, 
                    i.description, 
                    i.solution, 
                    i.creation_date
                FROM bd_incidents i
                JOIN ubications u ON i.id_ubication = u.id
                JOIN departments d ON i.id_department = d.id
                JOIN categories c ON i.id_category = c.id
                WHERE i.id = $1
            `, [id]);
            const incidentData = metaResult.rows[0];

            const formattedId = id.toString().padStart(6, '0');
            const token = generarTokenIncidencia(id, reporterEmail);
            const publicViewUrl = `${frontendUrl}/incidencias/view?token=${token}`;

            await sendMail({
                to: reporterEmail,
                subject: `✅ Tu incidencia #${formattedId} ha sido resuelta`,
                html: `
                    <h3>Hola ${reporterName},</h3>
                    <p>Tu incidencia ha sido resuelta.</p>
                    <p><strong>Incidencia N°:</strong> ${formattedId}</p>
                    <p><strong>Ubicación:</strong> ${incidentData.ubication_name}</p>
                    <p><strong>Departamento:</strong> ${incidentData.department_name}</p>
                    <p><strong>Categoría:</strong> ${incidentData.category_name}</p>
                    <p><strong>Descripción:</strong> ${incidentData.description}</p>
                    <p><strong>Solución:</strong> ${incidentData.solution || 'No proporcionada'}</p>
                    <p>Puedes revisar más detalles en el sistema de incidencias.</p>
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

        // 8. Notificar por Socket.IO
        const io = req.app.get('io');
        io.to(`incident_${id}`).emit('incidentUpdated', updatedIncident);

        res.json(updatedIncident);
    } catch (err) {
        console.error('Error al actualizar incidencia:', err);
        res.status(500).json({ error: 'Error al actualizar incidencia', details: err.message });
    }
});

module.exports = router;