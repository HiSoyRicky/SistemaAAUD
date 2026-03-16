import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import sendMail from './mailer.js';
import { prisma } from '../../config/prisma.js';

dotenv.config();

let ioInstance = null;

function setSocketIO(io) {
    ioInstance = io;
}

async function procesarRespuestasTecnicos() {
    const client = new ImapFlow({
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT, 10),
        secure: true,
        auth: {
            user: process.env.IMAP_USER,
            pass: process.env.IMAP_PASS,
        },
    });

    try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");

        try {
            const messages = client.fetch({ seen: false }, { source: true });

            for await (const message of messages) {
                try {
                    const parsed = await simpleParser(message.source);
                    const match = parsed.subject?.match(/\(#(\d+)\)/);

                    if (!match) {
                        continue;
                    }

                    const idIncidencia = Number(match[1]);
                    if (Number.isNaN(idIncidencia)) {
                        continue;
                    }

                    const emailRemitente =
                        parsed.from?.value?.[0]?.address?.toLowerCase() || "";

                    if (!emailRemitente) {
                        continue;
                    }

                    const incident = await prisma.bd_incidents.findUnique({
                        where: { id: idIncidencia },
                        select: {
                            id: true,
                            ticket_number: true,
                            reporter_name: true,
                            email: true,
                            users_bd_incidents_id_technicianTousers: {
                                select: {
                                    email: true,
                                    nombre_completo: true,
                                },
                            },
                        },
                    });

                    const technicianEmail =
                        incident?.users_bd_incidents_id_technicianTousers?.email?.toLowerCase() ||
                        null;

                    if (!incident || !technicianEmail) {
                        continue;
                    }

                    if (emailRemitente !== technicianEmail) {
                        continue;
                    }

                    const solutionText =
                        (parsed.text || "").trim() || "Solución proporcionada por correo.";

                    const updatedIncident = await prisma.bd_incidents.update({
                        where: { id: idIncidencia },
                        data: {
                            solution: solutionText,
                            solution_date: new Date(),
                            id_status: 3,
                        },
                        include: {
                            users_bd_incidents_id_technicianTousers: {
                                select: { nombre_completo: true },
                            },
                        },
                    });

                    if (ioInstance) {
                        ioInstance.to(`incident_${idIncidencia}`).emit("incidentUpdated", {
                            ...updatedIncident,
                            technician_full_name:
                                updatedIncident.users_bd_incidents_id_technicianTousers
                                    ?.nombre_completo || null,
                        });
                    }

                    if (incident.email) {
                        const formattedId = String(
                            incident.ticket_number || idIncidencia
                        ).padStart(6, "0");

                        await sendMail({
                            to: incident.email,
                            subject: `✅ Incidencia #${formattedId} resuelta por técnico`,
                            html: `
                                <h3>Hola ${incident.reporter_name || "usuario"},</h3>
                                <p>El técnico ha resuelto tu incidencia vía correo.</p>
                                <p><strong>Solución:</strong> ${solutionText}</p>
                                <p>Sistema de Incidencias AAUD</p>
                            `,
                        });
                    }
                } catch (messageError) {
                    console.error("Error procesando correo:", messageError);
                } finally {
                    await client.messageFlagsAdd(message.uid, ["\\Seen"]).catch(() => { });
                }
            }
        } finally {
            lock.release();
        }
    } catch (error) {
        console.error("Error procesando respuestas técnicas:", error);
    } finally {
        await client.logout().catch(() => { });
    }
}

function startTechnicianEmailProcessor(intervalMs = 60 * 1000) {
    return setInterval(procesarRespuestasTecnicos, intervalMs);
}

export { procesarRespuestasTecnicos,
    startTechnicianEmailProcessor,
    setSocketIO, };