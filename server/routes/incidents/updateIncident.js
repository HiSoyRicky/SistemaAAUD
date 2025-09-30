const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const sendMail = require('../../utils/mailer');
const { generarTokenIncidencia } = require('../../utils/token');
const frontendUrl = process.env.FRONTEND_BASE_URL;
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

router.put('/:id', catchAsync(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { description, category, status, solution, solution_date, technician, silent } = req.body;

    if (isNaN(id)) throw new AppError('ID inválido', 400);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Ver incidencia actual
        const currentIncidenceResult = await client.query(
            'SELECT id_status, email, reporter_name FROM bd_incidents WHERE id = $1',
            [id]
        );
        if (currentIncidenceResult.rows.length === 0) {
            throw new Error('Incidencia no encontrada');
        }

        const { id_status: currentStatus, email: reporterEmail, reporter_name: reporterName } = currentIncidenceResult.rows[0];

        // 2. Buscar técnico si lo enviaron
        let id_technician = null;
        if (technician) {
            const techResult = await client.query(
                'SELECT id FROM users WHERE username = $1 AND id_rol = 2 AND active = 1',
                [technician]
            );
            if (techResult.rows.length === 0) {
                throw new Error('Técnico no encontrado o no activo');
            }
            id_technician = techResult.rows[0].id;
        }

        // 3. Mapear status a id_status
        const statusMap = { 'Pendiente': 1, 'Asignado': 2, 'Resuelto': 3 };
        const id_status = statusMap[status] || undefined;

        if (id_status === 3 && (!solution || solution.trim() === '')) {
            throw new Error('Solución requerida para status Resuelto');
        }

        // 4. Construir query dinámicamente
        const updates = [];
        const values = [];
        let index = 1;

        if (description !== undefined) { updates.push(`description = $${index++}`); values.push(description); }
        if (category !== undefined) {
            const catCheck = await client.query('SELECT id FROM categories WHERE id = $1', [category]);
            if (catCheck.rows.length === 0) throw new Error('Categoría inválida');
            updates.push(`id_category = $${index++}`); values.push(category);
        }
        if (id_technician !== null) { updates.push(`id_technician = $${index++}`); values.push(id_technician); }
        if (id_status !== undefined) { updates.push(`id_status = $${index++}`); values.push(id_status); }
        if (solution !== undefined) { updates.push(`solution = $${index++}`); values.push(solution); }
        if (solution_date !== undefined) {
            const dateValue = solution_date && solution_date.trim() !== '' ? new Date(solution_date) : null;
            if (dateValue && isNaN(dateValue.getTime())) throw new Error('Fecha de solución inválida');
            updates.push(`solution_date = $${index++}`); values.push(dateValue);
        }

        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        const query = `UPDATE bd_incidents SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
        await client.query(query, values);

        // 5. Obtener incidencia actualizada (con joins)
        const fullUpdatedResult = await client.query(`
                SELECT
                    i.id, i.id_user, i.reporter_name, i.email AS reporter_email,
                    u.name AS ubication_name, d.name AS department_name, c.name AS category_name,
                    i.description, i.id_category, i.other_category_detail, i.id_status,
                    i.creation_date, i.solution_date, i.solution,
                    t.nombre_completo AS technician_full_name, t.email AS technician_email, i.id_technician
                FROM bd_incidents i
                LEFT JOIN users t ON i.id_technician = t.id
                LEFT JOIN ubications u ON i.id_ubication = u.id
                LEFT JOIN departments d ON i.id_department = d.id
                LEFT JOIN categories c ON i.id_category = c.id
                WHERE i.id = $1
            `, [id]);

        if (fullUpdatedResult.rows.length === 0) {
            throw new Error('Incidencia no encontrada después de actualizar');
        }

        const updatedIncident = fullUpdatedResult.rows[0];

        await client.query('COMMIT');

        // 6. Enviar correo al técnico asignado (usa updatedIncident)
        if (id_technician && !silent && updatedIncident.technician_email) {
            const formattedId = id.toString().padStart(6, '0');
            const privateViewUrl = `${frontendUrl}/incidencias/${formattedId}`;
            await sendMail({
                to: updatedIncident.technician_email,
                subject: `🔧 Nueva incidencia asignada (#${formattedId})`,
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
                            ">Incidencia Asignada</h2>

                            <p style="font-size: 16px; color: #374151;">
                                Hola ${updatedIncident.technician_full_name}, se te ha asignado una nueva incidencia:
                            </p>

                            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                                    <td style="padding: 8px;">${formattedId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                                    <td style="padding: 8px;">${updatedIncident.reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${updatedIncident.ubication_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${updatedIncident.department_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${updatedIncident.category_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${updatedIncident.other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${updatedIncident.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${updatedIncident.creation_date.toLocaleString('es-PA')}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${privateViewUrl}" style="
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

        // 7. Enviar correo al reportero si se resolvió (usa updatedIncident)
        if (currentStatus !== 3 && id_status === 3 && reporterEmail && !silent) {
            const formattedId = id.toString().padStart(6, '0');
            const token = generarTokenIncidencia(id, reporterEmail);
            const publicViewUrl = `${frontendUrl}/public/incidencia/${formattedId}?token=${token}`;

            await sendMail({
                to: reporterEmail,
                subject: `✅ Tu incidencia #${formattedId} ha sido resuelta`,
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
                                    ">Incidencia Resuelta</h2>

                            <p style="font-size: 16px; color: #374151;">
                                Hola ${reporterName}, tu incidencia ha sido resuelta:
                            </p>

                            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                                    <td style="padding: 8px;">${formattedId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                                    <td style="padding: 8px;">${updatedIncident.reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${updatedIncident.ubication_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${updatedIncident.department_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${updatedIncident.category_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${updatedIncident.other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${updatedIncident.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${updatedIncident.creation_date.toLocaleString('es-PA')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Solución:</td>
                                    <td style="padding: 8px;">${updatedIncident.solution}</td>
                                </tr>
                                <tr>
                                <td style="padding: 8px; font-weight: bold;">Fecha de solución:</td>
                                <td style="padding: 8px;">${updatedIncident.solution_date ? new Date(updatedIncident.solution_date).toLocaleDateString('es-PA') : 'N/A'}
                                </td>
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
                                Por favor, no responda a este correo. Este buzón no está monitoreado.<br />
                                Para cualquier consulta, utilice el sistema de incidencias.<br />
                                Gracias.
                            </p>
                        </div>
                    </div>
                    `
            });
        }

        // 8. Notificar por Socket.IO
        const io = req.app.get('io');
        io.to(`incident_${id}`).emit('incidentUpdated', updatedIncident);

        res.json(updatedIncident);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

}));

module.exports = router;