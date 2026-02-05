const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const sendMail = require('../../utils/mailer');
const { generarTokenIncidencia } = require('../../utils/token');
const frontendUrl = process.env.FRONTEND_BASE_URL;
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

router.put('/:id', catchAsync(async (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) throw new AppError('ID inválido', 400);

    const {
        description,
        category,
        status,
        solution,
        solution_date,
        id_technician,
        silent
    } = req.body;

    // 3. Mapear status a id_status
    const statusMap = { 'Pendiente': 1, 'Asignado': 2, 'Resuelto': 3 };
    const id_status = statusMap[status] || undefined;

    if (id_status === 3 && (!solution || solution.trim() === '')) {
        throw new Error('Solución requerida para status Resuelto');
    }

    const { updated, previous } = await prisma.$transaction(async (tx) => {

        const previous = await tx.bd_incidents.findUnique({
            where: { id },
            select: {
                id_status: true,
                email: true,
                reporter_name: true
            }
        });

        if (!previous) throw new AppError('Incidencia no encontrada', 404);

        const data = {};
        if (description !== undefined) data.description = description;
        if (category !== undefined) data.id_category = category;
        if (id_status !== undefined) data.id_status = id_status;
        if (solution !== undefined) data.solution = solution;

        if (id_status === 2) {
            if (!id_technician) {
                throw new AppError(
                    'No se puede asignar una incidencia sin técnico',
                    400
                );
            }

            const tech = await tx.users.findFirst({
                where: {
                    id: Number(id_technician),
                    id_rol: 2,
                    active: 1
                }
            });

            if (!tech) throw new AppError('Técnico no válido', 400);

            data.id_technician = Number(id_technician);
            data.id_status = 2;
        }

        if (solution_date !== undefined) {
            const dateValue = solution_date ? new Date(solution_date) : null;
            if (dateValue && isNaN(dateValue.getTime())) {
                throw new AppError('Fecha de solución inválida', 400);
            }
            data.solution_date = dateValue;
        }

        await tx.bd_incidents.update({
            where: { id },
            data
        });

        const updated = await tx.bd_incidents.findUnique({
            where: { id },
            include: {
                ubications: true,
                departments: true,
                categories: true,
                users_bd_incidents_id_technicianTousers: true
            }
        });

        return { updated, previous };
    });

    // 6. Enviar correo al técnico asignado
    if (id_technician &&
        !silent &&
        updated.users_bd_incidents_id_technicianTousers) {
        const formattedId = id.toString().padStart(6, '0');
        const privateViewUrl = `${frontendUrl}/incidencias/${formattedId}`;
        await sendMail({
            to: updated.users_bd_incidents_id_technicianTousers.email,
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
                                Hola ${updated.users_bd_incidents_id_technicianTousers.nombre_completo}, se te ha asignado una nueva incidencia:
                            </p>

                            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                                    <td style="padding: 8px;">${formattedId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                                    <td style="padding: 8px;">${updated.reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${updated.ubications?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${updated.departments?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${updated.categories?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${updated.other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${updated.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${updated.creation_date.toLocaleString('es-PA', { timeZone: 'America/Panama' })}</td>
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

    // 7. Enviar correo al reportero si se resolvió
    if (
        previous.id_status !== 3 &&
        id_status === 3 &&
        previous.email &&
        !silent
    ) {
        const formattedId = id.toString().padStart(6, '0');
        const token = generarTokenIncidencia(id, previous.email);
        const publicViewUrl = `${frontendUrl}/public/incidencia/${formattedId}?token=${token}`;

        await sendMail({
            to: previous.email,
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
                                Hola ${previous.reporter_name}, tu incidencia ha sido resuelta:
                            </p>

                            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                                    <td style="padding: 8px;">${formattedId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                                    <td style="padding: 8px;">${updated.reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${updated.ubications?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${updated.departments?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${updated.categories?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${updated.other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${updated.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${updated.creation_date.toLocaleString('es-PA')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Solución:</td>
                                    <td style="padding: 8px;">${updated.solution}</td>
                                </tr>
                                <tr>
                                <td style="padding: 8px; font-weight: bold;">Fecha de solución:</td>
                                <td style="padding: 8px;">${updated.solution_date ? new Date(updated.solution_date).toLocaleString('es-PA', { timeZone: 'America/Panama' }) : 'N/A'}</td>
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

    const mappedUpdated = {
        id_incident: updated.id,
        id_user: updated.id_user,
        reporter_name: updated.reporter_name,
        reporter_email: updated.email,
        ubication_name: updated.ubications?.name || null,
        department_name: updated.departments?.name || null,
        description: updated.description,
        id_category: updated.id_category,
        other_category_detail: updated.other_category_detail,
        id_status: updated.id_status,
        creation_date: updated.creation_date,
        solution_date: updated.solution_date,
        solution: updated.solution,
        id_technician: updated.id_technician,
        technician_full_name: updated.users_bd_incidents_id_technicianTousers?.nombre_completo || null
    };

    // 8. Notificar por Socket.IO
    const io = req.app.get('io');
    io.to(`incident_${id}`).emit('incidentUpdated', mappedUpdated);

    res.json(mappedUpdated);
}));

module.exports = router;