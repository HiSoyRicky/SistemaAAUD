// incidentUpdateService.js

import AppError from '../../common/utils/AppError.js';
import { getResolvedUserPermissionCodes, hasPermissionCode } from '../../common/rbac/permissions.service.js';
import { prisma } from '../../config/prisma.js';
import { scheduleIncidentUpdatedNotification } from './incidentUpdateNotificationService.js';

const statusMap = { Pendiente: 1, Asignado: 2, Resuelto: 3 };

const updatedIncidentSelect = {
  id: true,
  ticket_number: true,
  id_user: true,
  reporter_name: true,
  email: true,
  description: true,
  id_category: true,
  other_category_detail: true,
  id_status: true,
  creation_date: true,
  solution_date: true,
  solution: true,
  id_technician: true,
  ubications: { select: { name: true } },
  departments: { select: { name: true } },
  categories: { select: { name: true } },
  users_bd_incidents_id_technicianTousers: {
    select: { nombre_completo: true, email: true },
  },
};

const previousIncidentSelect = {
  id_status: true,
  id_technician: true,
  email: true,
  reporter_name: true,
};

function parseIncidentId(idParam) {
  const id = Number(idParam);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }
  return id;
}

function parseRequestedStatus(status) {
  return statusMap[status] || undefined;
}

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function isConsultor(user) {
  return (
    Number(user?.id_rol) === 3 ||
    normalizeRole(user?.role) === 'consultor' ||
    normalizeRole(user?.role_name) === 'consultor'
  );
}

function parseSolutionDate(solutionDateInput) {
  if (solutionDateInput === undefined) {
    return undefined;
  }

  const dateValue = solutionDateInput ? new Date(solutionDateInput) : null;
  if (dateValue && Number.isNaN(dateValue.getTime())) {
    throw new AppError('Fecha de solución inválida', 400);
  }
  return dateValue;
}

function validateResolutionPayload(requestedStatusId, solution) {
  if (requestedStatusId === 3 && (!solution || solution.trim() === '')) {
    throw new AppError('Solución requerida para status Resuelto');
  }
}

function mapUpdatedIncident(updated) {
  return {
    id_incident: updated.id,
    ticket_number: updated.ticket_number,
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
    technician_full_name: updated.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
  };
}

async function buildUpdateData({ tx, payload, previousIncident, currentUser, requestedStatusId }) {
  const data = {};
  const grantedPermissions = await getResolvedUserPermissionCodes(currentUser);
  const canUpdate = hasPermissionCode({
    grantedCodes: grantedPermissions,
    requiredCode: 'incidents.update',
  });
  const canAssign = hasPermissionCode({
    grantedCodes: grantedPermissions,
    requiredCode: 'incidents.assign',
  });
  const hasAssignment = payload.id_technician !== undefined;
  const hasOtherChanges = [
    'description',
    'category',
    'solution',
    'status',
    'solution_date',
  ].some((field) => payload[field] !== undefined);

  if ((!hasAssignment || hasOtherChanges) && !canUpdate) {
    throw new AppError('No tiene permiso para editar incidencias', 403);
  }

  if (hasAssignment && !canAssign) {
    throw new AppError('No tiene permiso para asignar incidencias', 403);
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.category !== undefined) {
    data.id_category = payload.category;
  }

  if (payload.solution !== undefined) {
    data.solution = payload.solution;
  }

  if (requestedStatusId !== undefined) {
    data.id_status = requestedStatusId;
  }

  if (payload.id_technician !== undefined) {
    if (isConsultor(currentUser) && previousIncident.id_status !== 1) {
      throw new AppError('No tiene permiso para reasignar incidencias', 403);
    }

    const tech = await tx.users.findFirst({
      where: {
        id: Number(payload.id_technician),
        id_rol: 2,
        active: true,
      },
    });

    if (!tech) {
      throw new AppError('Técnico no válido', 400);
    }

    data.id_technician = Number(payload.id_technician);

    if (previousIncident.id_status === 1) {
      data.id_status = 2;
    }
  }

  const parsedSolutionDate = parseSolutionDate(payload.solution_date);
  if (parsedSolutionDate !== undefined) {
    data.solution_date = parsedSolutionDate;
  }

  return data;
}

async function applyIncidentUpdate({
  tx,
  incidentId,
  previousIncident,
  data,
  requestedTechnicianId,
}) {
  if (requestedTechnicianId !== undefined && previousIncident.id_status === 1) {
    const assignmentResult = await tx.bd_incidents.updateMany({
      where: {
        id: incidentId,
        id_status: 1,
      },
      data,
    });

    if (assignmentResult.count === 0) {
      throw new AppError(
        'La incidencia ya fue asignada por otro usuario. Actualiza la lista para ver el estado real.',
        409
      );
    }

    return;
  }

  await tx.bd_incidents.update({
    where: { id: incidentId },
    data,
  });
}

async function updateIncident({ idParam, payload, currentUser, io }) {
  if (!currentUser?.id) {
    throw new AppError('No autenticado', 401);
  }

  const incidentId = parseIncidentId(idParam);
  const requestedStatusId = parseRequestedStatus(payload.status);
  validateResolutionPayload(requestedStatusId, payload.solution);

  const { updatedIncident, previousIncident } = await prisma.$transaction(async (tx) => {
    const previousIncident = await tx.bd_incidents.findUnique({
      where: { id: incidentId },
      select: previousIncidentSelect,
    });

    if (!previousIncident) {
      throw new AppError('Incidencia no encontrada', 404);
    }

    if (previousIncident.id_status === 3) {
      throw new AppError('No se puede modificar una incidencia resuelta', 400);
    }

    const data = await buildUpdateData({
      tx,
      payload,
      previousIncident,
      currentUser,
      requestedStatusId,
    });

    await applyIncidentUpdate({
      tx,
      incidentId,
      previousIncident,
      data,
      requestedTechnicianId: payload.id_technician,
    });

    const updatedIncident = await tx.bd_incidents.findUnique({
      where: { id: incidentId },
      select: updatedIncidentSelect,
    });

    return { updatedIncident, previousIncident };
  });

  const mappedIncident = mapUpdatedIncident(updatedIncident);

  if (io) {
    io.emit('incidentUpdated', mappedIncident);
  }

  scheduleIncidentUpdatedNotification({
    incidentId,
    mappedIncident,
    updatedIncident,
    previousIncident,
    requestedStatusId,
    requestedTechnicianId: payload.id_technician,
    silent: payload.silent,
    io,
  });

  return mappedIncident;
}

export { updateIncident };
