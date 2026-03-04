// incidentService.js

import { prisma } from '../../Prisma.js';
import AppError from '../../utils/AppError.js';
import { getClientIp } from '../../utils/clientInfo.js';
import { scheduleIncidentCreatedNotification } from './incidentNotificationService.js';

const statusMap = { Pendiente: 1, 'En proceso': 2, Resuelto: 3 };

const incidentSelect = {
    id: true,
    ticket_number: true,
    reporter_name: true,
    email: true,
    description: true,
    other_category_detail: true,
    creation_date: true,
    solution: true,
    solution_date: true,
    id_status: true,
    id_technician: true,
    ubications: {
        select: { name: true }
    },
    departments: {
        select: { name: true }
    },
    categories: {
        select: { name: true }
    },
    users_bd_incidents_id_technicianTousers: {
        select: { nombre_completo: true }
    }
};

function parseSolutionDate(solutionDateInput) {
    if (!solutionDateInput) {
        return null;
    }

    const solutionDate = new Date(solutionDateInput);

    if (Number.isNaN(solutionDate.getTime())) {
        throw new AppError('Fecha de solución inválida', 400);
    }

    return solutionDate;
}

function buildCreateData(payload, clientIp) {
    const userIdNum = Number(payload.id_user);
    const ubicationIdNum = Number(payload.id_ubication);
    const departmentIdNum = Number(payload.id_department);
    const categoryIdNum = Number(payload.id_category);

    if (
        !userIdNum ||
        !ubicationIdNum ||
        !departmentIdNum ||
        !categoryIdNum ||
        !payload.description ||
        !payload.reporter_name
    ) {
        throw new AppError('Datos requeridos inválidos o faltantes', 400);
    }

    return {
        id_user: userIdNum,
        reporter_name: payload.reporter_name,
        email: payload.email || null,
        id_ubication: ubicationIdNum,
        id_department: departmentIdNum,
        description: payload.description,
        id_category: categoryIdNum,
        other_category_detail: payload.other_category_detail || null,
        id_status: statusMap[payload.status] || 1,
        creation_date: new Date(),
        solution_date: parseSolutionDate(payload.solution_date),
        solution: payload.solution || '',
        client_ip: clientIp
    };
}

function formatTicket(ticketNumber) {
    return String(ticketNumber).padStart(6, '0');
}

function mapIncidentResponse(incident) {
    return {
        id_incident: incident.id,
        ticket_number: formatTicket(incident.ticket_number),
        reporter_name: incident.reporter_name,
        reporter_email: incident.email,
        ubication_name: incident.ubications?.name,
        department_name: incident.departments?.name,
        category_name: incident.categories?.name,
        description: incident.description,
        id_status: incident.id_status,
        creation_date: incident.creation_date,
        solution_date: incident.solution_date,
        solution: incident.solution,
        technician_full_name:
            incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null
    };
}

async function createIncident({ payload, req, io }) {
    const clientIp = getClientIp(req);
    const createData = buildCreateData(payload, clientIp);

    const newIncident = await prisma.$transaction(async (tx) => {
        const created = await tx.bd_incidents.create({
            data: createData
        });

        return tx.bd_incidents.findUnique({
            where: { id: created.id },
            select: incidentSelect
        });
    });

    if (!newIncident) {
        throw new AppError('No fue posible crear la incidencia', 500);
    }

    const response = mapIncidentResponse(newIncident);

    scheduleIncidentCreatedNotification({
        incident: newIncident,
        response,
        io
    });

    return response;
}

export { createIncident };