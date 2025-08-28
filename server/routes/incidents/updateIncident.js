// server/routes/incidencias/updateIncidencia.js

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getPoolDB } = require('../../db/db');
const sendMail = require('../../utils/mailer');
const { generarTokenIncidencia } = require('../../utils/token');
const frontendUrl = process.env.FRONTEND_BASE_URL;

// Endpoint para actualizar una incidencia
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { description, category, status, solution, solution_date, technician, silent } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    try {
        const pool = await getPoolDB();

        const currentIncidenceResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id_status, email, reporter_name FROM BD_Incidents WHERE id = @id');
        if (currentIncidenceResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada' });
        }
        const currentStatus = currentIncidenceResult.recordset[0].id_status;
        const reporterEmail = currentIncidenceResult.recordset[0].email;
        const reporterName = currentIncidenceResult.recordset[0].reporter_name;

        let id_technician = null;
        if (technician) {
            const techResult = await pool.request()
                .input('username', sql.NVarChar, technician)
                .query('SELECT id FROM users WHERE username = @username AND id_rol = 2 AND active = 1');
            if (techResult.recordset.length === 0) {
                return res.status(400).json({ error: 'Técnico no encontrado o no activo' });
            }
            id_technician = techResult.recordset[0].id;
        }

        const id_status = status === 'Pendiente' ? 1 : status === 'Asignado' ? 2 : 3;

        const updates = [];
        const request = pool.request();

        if (description !== undefined) {
            updates.push('description = @description');
            request.input('description', sql.NVarChar, description);
        }
        if (category !== undefined) {
            updates.push('id_category = @category');
            request.input('category', sql.Int, category);
        }
        if (id_technician !== null) {
            updates.push('id_technician = @id_technician');
            request.input('id_technician', sql.Int, id_technician);
        }
        if (id_status !== undefined) {
            updates.push('id_status = @id_status');
            request.input('id_status', sql.Int, id_status);
        }
        if (solution !== undefined) {
            updates.push('solution = @solution');
            request.input('solution', sql.NVarChar, solution);
        }
        if (solution_date !== undefined) {
            const solDate = solution_date ? new Date(solution_date) : null;
            updates.push('solution_date = @solution_date');
            request.input('solution_date', sql.DateTime, solDate);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        const query = `UPDATE BD_Incidents SET ${updates.join(', ')} WHERE id = @id`;
        request.input('id', sql.Int, id);

        await request.query(query);

        const updatedIncidentResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
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
                FROM BD_Incidents i
                LEFT JOIN users t ON i.id_technician = t.id
                LEFT JOIN ubications u ON i.id_ubication = u.id
                LEFT JOIN departments d ON i.id_department = d.id
                WHERE i.id = @id
            `);

        if (updatedIncidentResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Incidencia no encontrada después de actualizar' });
        }

        const updatedIncident = updatedIncidentResult.recordset[0];

        if (id_technician && !silent) {
            const techInfoResult = await pool.request()
                .input('id', sql.Int, id_technician)
                .input('incidentId', sql.Int, id)
                .query(`
                    SELECT 
                        u.nombre_completo AS technician_name,
                        u.email AS technician_email,
                        i.description,
                        i.creation_date,
                        i.id,
                        i.reporter_name,
                        i.other_category_detail
                    FROM users u
                    JOIN BD_Incidents i ON i.id = @incidentId
                    WHERE u.id = @id
                `);

            const techInfo = techInfoResult.recordset[0];

            if (techInfo && techInfo.technician_email) {
                const metaResult = await pool.request()
                    .input('id', sql.Int, id)
                    .query(`
                        SELECT u.name AS ubication_name, d.name AS department_name, c.name AS category_name
                        FROM BD_Incidents i
                        JOIN ubications u ON i.id_ubication = u.id
                        JOIN departments d ON i.id_department = d.id
                        JOIN categories c ON i.id_category = c.id
                        WHERE i.id = @id
                    `);

                if (metaResult.recordset.length === 0) {
                    console.error('No se encontraron metadatos para la incidencia:', id);
                    return res.status(500).json({ error: 'No se encontraron metadatos para la incidencia' });
                }

                const { ubication_name, department_name, category_name } = metaResult.recordset[0];

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

        if (currentStatus !== 3 && id_status === 3 && reporterEmail && !silent) {
            const metaResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT u.name AS ubication_name, d.name AS department_name, c.name AS category_name, i.description, i.solution, i.creation_date
                    FROM BD_Incidents i
                    JOIN ubications u ON i.id_ubication = u.id
                    JOIN departments d ON i.id_department = d.id
                    JOIN categories c ON i.id_category = c.id
                    WHERE i.id = @id
                `);
            const incidentData = metaResult.recordset[0];

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

        const io = req.app.get('io');
        // Emitir a la sala del id
        io.to(`incident_${id}`).emit('incidentUpdated', updatedIncident);

        // Si tienes token y quieres emitir a la sala de token (si aplica)
        if (updatedIncident.token) {
            io.to(`token_${updatedIncident.token}`).emit('incidentUpdated', updatedIncident);
        }

        res.json(updatedIncident);
    } catch (err) {
        console.error('Error al actualizar incidencia:', err);
        res.status(500).json({ error: 'Error al actualizar incidencia', details: err.message });
    }
});

module.exports = router;