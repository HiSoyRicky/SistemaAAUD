// incidentNotificationService.js

import sendMail from '../../common/utils/mailer.js';
import { generarTokenIncidencia } from '../../common/utils/token.js';
import { getActiveEmails } from '../notificationRecipients/notificationRecipients.service.js';
import {
  buildInternalIncidentEmail,
  buildReporterIncidentEmail,
  buildReporterOutOfStockTonerEmail,
} from '../../templates/incidents/incidentEmailTemplate.js';

const frontendUrl = process.env.FRONTEND_BASE_URL;

// Los destinatarios internos se administran desde el panel de Administración
// (Notificaciones). La variable de entorno solo se usa como respaldo si aún
// no se ha configurado ningún destinatario en la base de datos.
async function getInternalRecipients() {
  const emails = await getActiveEmails();
  if (emails.length) {
    return emails.join(', ');
  }

  return process.env.INCIDENT_INTERNAL_RECIPIENTS || '';
}

function getPublicViewUrl(incident) {
  const token = generarTokenIncidencia(incident.id, incident.email);
  return `${frontendUrl}/incidencias/view?token=${token}`;
}

async function notifyIncidentCreated({ incident, response, io, tonerRequestContext }) {
  const formattedTicket = response.ticket_number;
  const publicViewUrl = getPublicViewUrl(incident);

  try {
    const internalRecipients = await getInternalRecipients();

    if (internalRecipients) {
      await sendMail({
        from: '"No responder" <no-responder@aaud.gob.pa>',
        to: internalRecipients,
        subject: `📥 Nueva incidencia registrada (#${formattedTicket})`,
        html: buildInternalIncidentEmail({
          incident,
          formattedTicket,
          publicViewUrl,
        }),
      });
    }

    if (incident.email) {
      await sendMail({
        to: incident.email,
        subject: `🕒 Confirmación de reporte de incidencia (#${formattedTicket})`,
        html: buildReporterIncidentEmail({
          incident,
          formattedTicket,
          publicViewUrl,
        }),
      });

      if (tonerRequestContext?.isTonerRequest && tonerRequestContext?.isOutOfStock) {
        await sendMail({
          to: incident.email,
          subject: `⚠️ Solicitud de tóner sin existencias (#${formattedTicket})`,
          html: buildReporterOutOfStockTonerEmail({
            incident,
            formattedTicket,
            publicViewUrl,
            tonerRequestContext,
          }),
        });
      }
    }
  } catch (mailErr) {
    console.error('Error al enviar correo:', mailErr);
  }

  if (io) {
    io.emit('incidentCreated', response);
  }
}

function scheduleIncidentCreatedNotification(payload) {
  setImmediate(() => {
    notifyIncidentCreated(payload).catch((notificationErr) => {
      console.error('Error al procesar notificación de incidencia:', notificationErr);
    });
  });
}

export { notifyIncidentCreated, scheduleIncidentCreatedNotification };
