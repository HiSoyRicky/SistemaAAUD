// imapClient.js

import dotenv from 'dotenv';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '../../config/prisma.js';
import sendMail from './mailer.js';

dotenv.config();

let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

function createImapClient() {
  return new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number.parseInt(process.env.IMAP_PORT, 10),
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
    },
  });
}

function getIncidentId(subject) {
  const match = subject?.match(/\(#(\d+)\)/);

  if (!match) {
    return null;
  }

  const id = Number(match[1]);

  return Number.isNaN(id) ? null : id;
}

function getSenderEmail(parsed) {
  return parsed.from?.value?.[0]?.address?.toLowerCase() || null;
}

async function findIncident(idIncidencia) {
  return prisma.bd_incidents.findUnique({
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
}

function isValidTechnicianEmail(incident, emailRemitente) {
  const technicianEmail = incident?.users_bd_incidents_id_technicianTousers?.email?.toLowerCase();

  return Boolean(incident && technicianEmail && emailRemitente === technicianEmail);
}

async function updateIncident(idIncidencia, solutionText) {
  return prisma.bd_incidents.update({
    where: { id: idIncidencia },
    data: {
      solution: solutionText,
      solution_date: new Date(),
      id_status: 3,
    },
    include: {
      users_bd_incidents_id_technicianTousers: {
        select: {
          nombre_completo: true,
        },
      },
    },
  });
}

function notifyIncidentUpdate(idIncidencia, updatedIncident) {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`incident_${idIncidencia}`).emit('incidentUpdated', {
    ...updatedIncident,
    technician_full_name:
      updatedIncident.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
  });
}

async function notifyReporter(incident, idIncidencia, solutionText) {
  if (!incident.email) {
    return;
  }

  const formattedId = String(incident.ticket_number || idIncidencia).padStart(6, '0');

  await sendMail({
    to: incident.email,
    subject: `✅ Incidencia #${formattedId} resuelta por técnico`,
    html: `
      <h3>Hola ${incident.reporter_name || 'usuario'},</h3>
      <p>El técnico ha resuelto tu incidencia vía correo.</p>
      <p><strong>Solución:</strong> ${solutionText}</p>
      <p>Sistema de Incidencias AAUD</p>
    `,
  });
}

async function procesarMensaje(message) {
  const parsed = await simpleParser(message.source);

  const idIncidencia = getIncidentId(parsed.subject);

  if (!idIncidencia) {
    return;
  }

  const emailRemitente = getSenderEmail(parsed);

  if (!emailRemitente) {
    return;
  }

  const incident = await findIncident(idIncidencia);

  if (!isValidTechnicianEmail(incident, emailRemitente)) {
    return;
  }

  const solutionText = (parsed.text || '').trim() || 'Solución proporcionada por correo.';

  const updatedIncident = await updateIncident(idIncidencia, solutionText);

  notifyIncidentUpdate(idIncidencia, updatedIncident);

  await notifyReporter(incident, idIncidencia, solutionText);
}

async function procesarRespuestasTec() {
  const client = createImapClient();

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');

    try {
      const messages = client.fetch({ seen: false }, { source: true });

      for await (const message of messages) {
        try {
          await procesarMensaje(message);
        } catch (messageError) {
          console.error('Error procesando correo:', messageError);
        } finally {
          await client.messageFlagsAdd(message.uid, [String.raw`\Seen`]).catch(() => {});
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error('Error procesando respuestas técnicas:', error);
  } finally {
    await client.logout().catch(() => {});
  }
}

function startTechnicianEmailProcessor(intervalMs = 60 * 1000) {
  return setInterval(procesarRespuestasTec, intervalMs);
}

export { procesarRespuestasTec, setSocketIO, startTechnicianEmailProcessor };
