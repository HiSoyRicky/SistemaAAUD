// incidentService.js

import AppError from '../../common/utils/AppError.js';
import { getClientIp } from '../../common/utils/clientInfo.js';
import { prisma } from '../../config/prisma.js';
import { scheduleIncidentCreatedNotification } from './incidentNotificationService.js';

const statusMap = { Pendiente: 1, 'En proceso': 2, Resuelto: 3 };

function normalizeCategoryName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

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
    select: { name: true },
  },
  departments: {
    select: { name: true },
  },
  categories: {
    select: { name: true },
  },
  users_bd_incidents_id_technicianTousers: {
    select: { nombre_completo: true },
  },
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

function parseOptionalPositiveInt(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function resolveTonerRequestContext({ categoryName, payload, tx }) {
  const normalizedCategoryName = normalizeCategoryName(categoryName);
  if (!normalizedCategoryName.includes('toner')) {
    return {
      isTonerRequest: false,
      isOutOfStock: false,
    };
  }

  const tonerId = parseOptionalPositiveInt(payload.id_toner);
  if (!tonerId) {
    return {
      isTonerRequest: true,
      isOutOfStock: false,
    };
  }

  const toner = await tx.toners.findUnique({
    where: { id: tonerId },
    include: { stock: true },
  });

  if (!toner) {
    return {
      isTonerRequest: true,
      isOutOfStock: false,
    };
  }

  const currentStock = toner.stock?.quantity ?? 0;

  return {
    isTonerRequest: true,
    isOutOfStock: currentStock <= 0,
    tonerId,
    currentStock,
    tonerColor: toner.color ? String(toner.color).toUpperCase() : null,
    tonerModel: toner.toner_model || null,
  };
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
    client_ip: clientIp,
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
    technician_full_name: incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
  };
}

async function createIncident({ payload, req, io }) {
  const clientIp = getClientIp(req);
  const createData = buildCreateData(payload, clientIp);

  const { newIncident, tonerRequestContext } = await prisma
    .$transaction(async (tx) => {
      const category = await tx.categories.findUnique({
        where: { id: createData.id_category },
        select: { id: true, name: true },
      });

      if (!category) {
        throw new AppError('Categoría inválida', 400);
      }

      const requestContext = await resolveTonerRequestContext({
        categoryName: category.name,
        payload,
        tx,
      });

      const last = await tx.bd_incidents.findFirst({
        orderBy: { ticket_number: 'desc' },
        select: { ticket_number: true },
      });

      const nextTicket = (last?.ticket_number || 0) + 1;

      const created = await tx.bd_incidents.create({
        data: {
          ...createData,
          ticket_number: nextTicket,
        },
      });

      const createdIncident = await tx.bd_incidents.findUnique({
        where: { id: created.id },
        select: incidentSelect,
      });

      return {
        newIncident: createdIncident,
        tonerRequestContext: requestContext,
      };
    })
    .catch((error) => {
      if (error?.code === 'P2003') {
        throw new AppError(
          'No se pudo crear la incidencia: verifique ubicación, departamento y categoría.',
          400
        );
      }

      throw error;
    });

  if (!newIncident) {
    throw new AppError('No fue posible crear la incidencia', 500);
  }

  const response = mapIncidentResponse(newIncident);

  scheduleIncidentCreatedNotification({
    incident: newIncident,
    response,
    io,
    tonerRequestContext,
  });

  return response;
}

export { createIncident };
