import sendMail from '../../utils/mailer.js';
import { generarTokenIncidencia } from '../../utils/token.js';
import { buildAssignmentIncidentEmail,
    buildResolvedIncidentEmail } from '../../templates/incidents/incidentUpdateEmailTemplate.js';

const frontendUrl = process.env.FRONTEND_BASE_URL;

function formatTicket(ticketNumber) {
    return String(ticketNumber).padStart(6, '0');
}

async function sendTechnicianAssignmentMail({ incident }) {
    const technician = incident.users_bd_incidents_id_technicianTousers;

    if (!technician?.email) {
        return;
    }

    const formattedTicket = formatTicket(incident.ticket_number);
    const privateViewUrl = `${frontendUrl}/incidencias/${formattedTicket}`;

    await sendMail({
        to: technician.email,
        subject: `🔧 Nueva incidencia asignada (#${formattedTicket})`,
        html: buildAssignmentIncidentEmail({
            incident,
            formattedTicket,
            privateViewUrl,
            technicianName: technician.nombre_completo
        })
    });
}

async function sendReporterResolvedMail({ incident, reporterEmail, reporterName }) {
    if (!reporterEmail) {
        return;
    }

    const formattedTicket = formatTicket(incident.ticket_number);
    const token = generarTokenIncidencia(incident.id, reporterEmail);
    const publicViewUrl = `${frontendUrl}/public/incidencia/${incident.id}?token=${token}`;

    await sendMail({
        to: reporterEmail,
        subject: `✅ Tu incidencia #${formattedTicket} ha sido resuelta`,
        html: buildResolvedIncidentEmail({
            incident,
            formattedTicket,
            publicViewUrl,
            reporterName
        })
    });
}

async function notifyIncidentUpdated({
    incidentId,
    mappedIncident,
    updatedIncident,
    previousIncident,
    requestedStatusId,
    requestedTechnicianId,
    silent,
    io
}) {
    const shouldNotifyTechnician =
        requestedTechnicianId !== undefined &&
        previousIncident.id_technician !== updatedIncident.id_technician &&
        !silent &&
        updatedIncident.users_bd_incidents_id_technicianTousers;

    const shouldNotifyReporterResolved =
        previousIncident.id_status !== 3 &&
        requestedStatusId === 3 &&
        previousIncident.email &&
        !silent;

    try {
        if (shouldNotifyTechnician) {
            await sendTechnicianAssignmentMail({
                incident: updatedIncident
            });
        }

        if (shouldNotifyReporterResolved) {
            await sendReporterResolvedMail({
                incident: updatedIncident,
                reporterEmail: previousIncident.email,
                reporterName: previousIncident.reporter_name
            });
        }
    } catch (mailErr) {
        console.error('Error al enviar correo de actualización de incidencia:', mailErr);
    }

    if (!io) {
        return;
    }

    if (updatedIncident.id_technician) {
        io.to(`user_${updatedIncident.id_technician}`).emit('incidentUpdated', mappedIncident);
    }

    io.to(`incident_${incidentId}`).emit('incidentUpdated', mappedIncident);
}

function scheduleIncidentUpdatedNotification(payload) {
    setImmediate(() => {
        notifyIncidentUpdated(payload).catch((notificationErr) => {
            console.error('Error al procesar notificación de actualización:', notificationErr);
        });
    });
}

export { notifyIncidentUpdated,
    scheduleIncidentUpdatedNotification };