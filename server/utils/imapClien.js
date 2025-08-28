// server/utils/imapClient.js
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getPoolDB } from './db/db';
import { io } from '../server';
import dotenv from 'dotenv';
import sendMail from './mailer';

dotenv.config();

async function procesarRespuestasTecnicos() {
    console.log('Iniciando procesamiento de respuestas técnicas...'); // Depuración

    const client = new ImapFlow({
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT),
        secure: true,
        auth: {
            user: process.env.IMAP_USER,
            pass: process.env.IMAP_PASS,
        },
        logger: {
            info: (msg) => console.log('IMAP INFO:', msg),
            debug: (msg) => console.log('IMAP DEBUG:', msg),
            error: (msg) => console.error('IMAP ERROR:', msg),
        },
    });

    try {
        console.log('Conectando al servidor IMAP...');
        await client.connect();
        console.log('Conexión IMAP establecida.');

        let lock = await client.getMailboxLock('INBOX');
        console.log('Buzón INBOX bloqueado para procesamiento.');
        try {
            // Buscar correos no leídos
            const messages = client.fetch({ seen: false }, { envelope: true, source: true });
            let foundMessages = false;

            for await (let message of messages) {
                foundMessages = true;
                console.log('Procesando correo con UID:', message.uid);
                let parsed = await simpleParser(message.source);

                // Extraer ID de incidencia del asunto
                const match = parsed.subject?.match(/\(#(\d+)\)/);
                if (!match) {
                    console.log(`Correo UID ${message.uid} no tiene ID de incidencia válido en el asunto: ${parsed.subject}`);
                    await client.messageFlagsAdd(message.uid, ['\\Seen']);
                    continue;
                }

                const idIncidencia = parseInt(match[1], 10);
                if (isNaN(idIncidencia)) {
                    console.log(`ID de incidencia no válido en correo UID ${message.uid}: ${match[1]}`);
                    await client.messageFlagsAdd(message.uid, ['\\Seen']);
                    continue;
                }

                // Validar remitente
                const emailRemitente = parsed.from?.value[0]?.address?.toLowerCase();
                if (!emailRemitente) {
                    console.log(`Correo UID ${message.uid} no tiene remitente válido.`);
                    await client.messageFlagsAdd(message.uid, ['\\Seen']);
                    continue;
                }
                console.log(`Correo de: ${emailRemitente} para incidencia #${idIncidencia}`);

                // Consultar técnico asignado y datos del reporter
                const pool = await getPoolDB();
                const techResult = await pool.request()
                    .input('id', idIncidencia)
                    .query(`
                        SELECT t.email AS technician_email, i.email AS reporter_email, i.reporter_name
                        FROM BD_Incidents i
                        LEFT JOIN users t ON i.id_technician = t.id
                        WHERE i.id = @id
                    `);

                if (techResult.recordset.length === 0 || !techResult.recordset[0].technician_email) {
                    console.log(`Incidencia #${idIncidencia} no encontrada o sin técnico asignado.`);
                    await client.messageFlagsAdd(message.uid, ['\\Seen']);
                    continue;
                }

                const technicianEmail = techResult.recordset[0].technician_email.toLowerCase();
                const reporterEmail = techResult.recordset[0].reporter_email;
                const reporterName = techResult.recordset[0].reporter_name;

                if (emailRemitente !== technicianEmail) {
                    console.log(`Remitente ${emailRemitente} no coincide con técnico asignado ${technicianEmail} para incidencia #${idIncidencia}.`);
                    await client.messageFlagsAdd(message.uid, ['\\Seen']);
                    continue;
                }

                // Actualizar incidencia
                const solutionText = (parsed.text || '').trim() || 'Solución proporcionada por correo.';
                console.log(`Actualizando incidencia #${idIncidencia} con solución: ${solutionText}`);
                await pool.request()
                    .input('id', idIncidencia)
                    .input('solution', solutionText)
                    .input('solution_date', new Date())
                    .input('id_status', 3)
                    .query(`
                        UPDATE BD_Incidents
                        SET solution = @solution,
                            solution_date = @solution_date,
                            id_status = @id_status
                        WHERE id = @id
                    `);

                // Obtener incidencia actualizada
                const updatedIncidentResult = await pool.request()
                    .input('id', idIncidencia)
                    .query(`
                        SELECT i.*, t.nombre_completo AS technician_full_name
                        FROM BD_Incidents i
                        LEFT JOIN users t ON i.id_technician = t.id
                        WHERE i.id = @id
                    `);

                if (updatedIncidentResult.recordset.length > 0) {
                    const updatedIncident = updatedIncidentResult.recordset[0];
                    console.log(`Emitiendo incidentUpdated para incidencia #${idIncidencia}`);
                    io.to(`incident_${idIncidencia}`).emit('incidentUpdated', updatedIncident);
                } else {
                    console.log(`No se encontró la incidencia #${idIncidencia} tras actualizar.`);
                }

                // Notificar al reporter
                if (reporterEmail) {
                    const formattedId = idIncidencia.toString().padStart(6, '0');
                    console.log(`Enviando notificación a ${reporterEmail} para incidencia #${formattedId}`);
                    await sendMail({
                        to: reporterEmail,
                        subject: `✅ Incidencia #${formattedId} resuelta por técnico`,
                        html: `
                            <h3>Hola ${reporterName},</h3>
                            <p>El técnico ha resuelto tu incidencia vía correo.</p>
                            <p><strong>Solución:</strong> ${solutionText}</p>
                            <p>Sistema de Incidencias AAUD</p>
                        `
                    });
                }

                // Marcar como leído
                await client.messageFlagsAdd(message.uid, ['\\Seen']);
                console.log(`Correo UID ${message.uid} marcado como leído.`);
            }

            if (!foundMessages) {
                console.log('No se encontraron correos no leídos para procesar.');
            }
        } finally {
            console.log('Liberando buzón INBOX.');
            lock.release();
        }
        console.log('Cerrando conexión IMAP.');
        await client.logout();
    } catch (error) {
        console.error('Error procesando respuestas técnicas:', error);
    }
}

// Ejecutar cada 30 segundos para pruebas (cambiar a 60 * 1000 en producción)
setInterval(procesarRespuestasTecnicos, 30 * 1000);