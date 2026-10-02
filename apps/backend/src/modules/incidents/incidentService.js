// incidentService.js

import AppError from '../../common/utils/AppError.js';
import { getClientIp } from '../../common/utils/clientInfo.js';
import { prisma } from '../../config/prisma.js';
import { appendPrinterIpsToIncidentDescription, getReporterIncidentDescription } from './incidentDescription.js';
import { scheduleIncidentCreatedNotification } from './incidentNotificationService.js';

const PUBLIC_INCIDENT_USER_ID = 2;

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

export async function resolveTonerPrinterIps({ categoryName, payload, tx }) {
  if (!normalizeCategoryName(categoryName).includes('toner')) return [];

  const printerModelId = parseOptionalPositiveInt(payload.id_printer_model);
  const tonerId = parseOptionalPositiveInt(payload.id_toner);
  if (!printerModelId || !tonerId) return [];

  const locationFilter = {
    inventory: {
      is: {
        id_ubication: Number(payload.id_ubication),
        id_department: Number(payload.id_department),
      },
    },
  };
  const printer = await tx.models.findFirst({
    where: {
      id: printerModelId,
      devices: { name: 'Impresora' },
      toners: { some: { id: tonerId } },
      inventory_devices: { some: locationFilter },
    },
    select: {
      inventory_devices: {
        where: locationFilter,
        select: { ip: true },
      },
    },
  });

  if (!printer) return [];
  return [
    ...new Set(
      (printer.inventory_devices || [])
        .map((device) => String(device.ip || '').trim())
        .filter(Boolean)
    ),
  ];
}

export function buildCreateData(payload, clientIp) {
  const userIdNum = PUBLIC_INCIDENT_USER_ID;
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
    id_status: 1,
    creation_date: new Date(),
    solution_date: null,
    solution: '',
    client_ip: clientIp,
  };
}

export async function validateIncidentLocation(tx, { departmentId, ubicationId }) {
  const department = await tx.departments.findUnique({
    where: { id: Number(departmentId) },
    select: { id: true, id_ubication: true },
  });

  if (!department || Number(department.id_ubication) !== Number(ubicationId)) {
    throw new AppError('El departamento no pertenece a la ubicación seleccionada', 400);
  }
}

export async function createIncidentRecord(tx, data) {
  return tx.bd_incidents.create({ data, select: { id: true } });
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
    description: getReporterIncidentDescription(incident.description),
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
      const actor = await tx.users.findUnique({
        where: { id: PUBLIC_INCIDENT_USER_ID },
        select: { id: true, active: true },
      });
      if (!actor?.active) {
        throw new AppError('El usuario genérico de incidencias (ID 2) no existe o está inactivo', 503);
      }

      await validateIncidentLocation(tx, {
        departmentId: createData.id_department,
        ubicationId: createData.id_ubication,
      });

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

      const printerIps = await resolveTonerPrinterIps({
        categoryName: category.name,
        payload,
        tx,
      });
      createData.description = appendPrinterIpsToIncidentDescription(
        createData.description,
        printerIps
      );

      const created = await createIncidentRecord(tx, createData);

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
