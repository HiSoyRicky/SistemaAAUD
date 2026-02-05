// server/routes/incidents/postIncident.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const sendMail = require('../../utils/mailer');
const { generarTokenIncidencia } = require('../../utils/token');
const frontendUrl = process.env.FRONTEND_BASE_URL;
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

const dns = require('dns').promises;

async function getClientInfo(req) {
    let ip =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        req.connection.remoteAddress;

    ip = ip?.replace(/^::ffff:/, '');

    let host = null;
    try {
        const [resolved] = await dns.reverse(ip);
        host = resolved;
    } catch {
        host = null;
    }

    return { ip };
}

const validateIncident = [
    body('id_user').isInt().withMessage('id_user debe ser un número entero'),
    body('id_ubication').isInt().withMessage('id_ubication debe ser un número entero'),
    body('id_department').isInt().withMessage('id_department debe ser un número entero'),
    body('description').notEmpty().withMessage('description es obligatorio'),
    body('id_category').isInt().withMessage('id_category debe ser un número entero'),
    body('reporter_name').notEmpty().withMessage('reporter_name es obligatorio')
];

router.post('/', validateIncident, catchAsync(async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

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
        reporter_name
    } = req.body;

    const userIdNum = Number(id_user);
    if (!userIdNum || !id_ubication || !id_department || !id_category || !description || !reporter_name) {
        return res.status(400).json({ error: 'Datos requeridos inválidos o faltantes' });
    }

    const statusMap = { Pendiente: 1, 'En proceso': 2, Resuelto: 3 };
    const id_status = statusMap[status] || 1;

    const creationDate = new Date();
    const solutionDate = solution_date ? new Date(solution_date) : null;

    if (solutionDate && isNaN(solutionDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de solución inválida' });
    }

    const { ip: clientIp } = await getClientInfo(req);

    const newIncident = await prisma.$transaction(async (tx) => {
        const created = await tx.bd_incidents.create({
            data: {
                id_user: userIdNum,
                reporter_name,
                email: email || null,
                id_ubication,
                id_department,
                description,
                id_category,
                other_category_detail: other_category_detail || null,
                id_status,
                creation_date: creationDate,
                solution_date: solutionDate,
                solution: solution || '',
                client_ip: clientIp
            }
        });

        return tx.bd_incidents.findUnique({
            where: { id: created.id },
            include: {
                ubications: { select: { name: true } },
                departments: { select: { name: true } },
                categories: { select: { name: true } },
                users_bd_incidents_id_technicianTousers: {
                    select: { nombre_completo: true }
                }
            }
        });
    });

    const formattedId = newIncident.id.toString().padStart(6, '0');

    const response = {
        id_incident: newIncident.id,
        reporter_name: newIncident.reporter_name,
        reporter_email: newIncident.email,
        ubication_name: newIncident.ubications?.name,
        department_name: newIncident.departments?.name,
        category_name: newIncident.categories?.name,
        description: newIncident.description,
        id_status: newIncident.id_status,
        creation_date: newIncident.creation_date,
        solution_date: newIncident.solution_date,
        solution: newIncident.solution,
        technician_full_name:
            newIncident.users_bd_incidents_id_technicianTousers?.nombre_completo || null
    };

    const token = generarTokenIncidencia(newIncident.id, email);
    const publicViewUrl = `${frontendUrl}/incidencias/view?token=${token}`;

    try {
        await sendMail({
            from: '"No responder" <no-responder@aaud.gob.pa>',
            to: 'abethancourt@aaud.gob.pa, lchanis@aaud.gob.pa, gmedina@aaud.gob.pa',
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
                                    <td style="padding: 8px;">${newIncident.reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${newIncident.ubications?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${newIncident.departments?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${newIncident.categories?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${newIncident.other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${newIncident.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${newIncident.creation_date.toLocaleString('es-PA', { timeZone: 'America/Panama' })}</td>
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
                subject: `🕒 Confirmación de reporte de incidencia (#${formattedId})`,
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
                                    <td style="padding: 8px;">${newIncident.reporter_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                                    <td style="padding: 8px;">${newIncident.ubications?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                                    <td style="padding: 8px;">${newIncident.departments?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                                    <td style="padding: 8px;">${newIncident.categories?.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                                    <td style="padding: 8px;">${newIncident.other_category_detail || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px;">${newIncident.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                                    <td style="padding: 8px;">${newIncident.creation_date.toLocaleString('es-PA', { timeZone: 'America/Panama' })}</td>
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
    io.emit('incidentCreated', response);

    return res.json(response);
}));

module.exports = router;