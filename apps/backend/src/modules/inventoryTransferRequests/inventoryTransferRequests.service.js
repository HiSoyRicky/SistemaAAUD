// inventoryTransferRequests.service.js

import AppError from '../../common/utils/AppError.js';
import { activityContext, prisma } from '../../config/prisma.js';
import { runWithActivityLoggingSuppressed } from '../../common/services/activityLogger.js';
import { mapInventoryItem } from '../inventory/inventory.dto.js';
import { includeRelations } from '../inventory/inventory.repository.js';
import { writeInventoryAuditEvent } from '../inventory/services/inventory-audit.service.js';
import {
  assertInventoryItemInScope,
  resolveInventoryScope,
  TECHNOLOGY_SCOPE_WHERE,
} from '../inventory/services/inventory-scope.service.js';

const userSummarySelect = { select: { id: true, nombre_completo: true, username: true } };

const transferInclude = {
  item: { include: includeRelations },
  requester: userSummarySelect,
  approver: userSummarySelect,
};

function parseId(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} inválido`, 400);
  }

  return parsed;
}

function normalizeStatus(status) {
  const value = String(status || '')
    .trim()
    .toUpperCase();
  return value || null;
}

function shouldClearAssignedUser(snapshot) {
  const departmentName = String(snapshot?.department_destino_name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  return departmentName.includes('INFORMATICA');
}

function resolveSnapshotAdministrativeArea(snapshot, currentAreaId) {
  if (!Object.hasOwn(snapshot, 'administrative_area_destino_id')) {
    return currentAreaId;
  }

  const value = snapshot.administrative_area_destino_id;
  if (value === null || value === '') return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Área administradora destino inválida', 400);
  }

  return parsed;
}

function buildScopeWhere(scope) {
  return scope?.technologyOnly ? { item: { is: TECHNOLOGY_SCOPE_WHERE } } : {};
}

export function buildPreviewInventory(request, item) {
  const snapshot = request.snapshot || {};
  const technology = item.device_details;

  return mapInventoryItem({
    ...item,
    ubications: { name: snapshot.ubication_destino_name || item.ubications?.name || null },
    departments: { name: snapshot.department_destino_name || item.departments?.name || null },
    administrative_area: {
      id: snapshot.administrative_area_destino_id ?? item.id_administrative_area ?? null,
      name:
        snapshot.administrative_area_destino_name || item.administrative_area?.name || null,
    },
    device_details: technology
      ? {
          ...technology,
          serie: snapshot.serie || technology.serie,
          ip: snapshot.ip ?? technology.ip,
        }
      : null,
    tag: snapshot.tag || item.tag,
    user: snapshot.userRecibe || snapshot.userName || item.user,
    observation: snapshot.observation || item.observation,
    id_ubication: snapshot.ubication_destino_id ?? item.id_ubication,
    id_department: snapshot.department_destino_id ?? item.id_department,
    id_administrative_area: snapshot.administrative_area_destino_id ?? item.id_administrative_area,
  });
}

function serializeTransferRequest(request) {
  const { item, ...transfer } = request;

  return {
    ...transfer,
    inventory_snapshot: item ? mapInventoryItem(item) : null,
    preview_inventory: item ? buildPreviewInventory(request, item) : null,
  };
}

export const getAll = async (currentUser, query = {}) => {
  const scope = await resolveInventoryScope(currentUser);
  const status = normalizeStatus(query.status);

  const requests = await prisma.inventory_transfer_requests.findMany({
    where: {
      ...(status ? { status } : {}),
      ...buildScopeWhere(scope),
    },
    orderBy: { requested_at: 'desc' },
    include: transferInclude,
  });

  return { data: requests.map(serializeTransferRequest) };
};

export const getMine = async (currentUser, query = {}) => {
  const requesterId = parseId(currentUser?.id, 'ID de usuario');
  const scope = await resolveInventoryScope(currentUser);
  const status = normalizeStatus(query.status);

  const requests = await prisma.inventory_transfer_requests.findMany({
    where: {
      requester_id: requesterId,
      ...(status ? { status } : {}),
      ...buildScopeWhere(scope),
    },
    orderBy: { requested_at: 'desc' },
    include: transferInclude,
  });

  return { data: requests.map(serializeTransferRequest) };
};

export async function createPendingTransferRequest({
  db = prisma,
  itemId,
  requesterId,
  snapshot,
  scope,
}) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "inventory_items" WHERE id = ${itemId} FOR UPDATE`;

    const item = await tx.inventory_items.findUnique({
      where: { id: itemId },
      include: { device_details: { select: { id: true } } },
    });
    if (!item) throw new AppError('Bien no encontrado', 404);
    assertInventoryItemInScope(item, scope);

    const pendingRequest = await tx.inventory_transfer_requests.findFirst({
      where: { item_id: itemId, status: 'PENDING' },
      select: { id: true },
    });
    if (pendingRequest) {
      throw new AppError('Ya existe una solicitud pendiente para este bien', 409);
    }

    return tx.inventory_transfer_requests.create({
      data: {
        item_id: itemId,
        requester_id: requesterId,
        snapshot,
      },
      include: { requester: userSummarySelect },
    });
  });
}

export const create = async (payload, currentUser) => {
  const itemId = parseId(payload?.item_id, 'ID de bien');
  const snapshot =
    payload?.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : null;

  if (!snapshot) {
    throw new AppError('La información del traslado es obligatoria', 400);
  }

  const scope = await resolveInventoryScope(currentUser);
  const created = await createPendingTransferRequest({
    itemId,
    requesterId: parseId(currentUser?.id, 'ID de usuario'),
    snapshot,
    scope,
  });

  return {
    success: true,
    message: 'Solicitud de traslado creada',
    request: created,
  };
};

async function resolveRequestOrFail(idParam, scope) {
  const id = parseId(idParam, 'ID de solicitud');

  const request = await prisma.inventory_transfer_requests.findUnique({
    where: { id },
    include: transferInclude,
  });

  if (!request) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  assertInventoryItemInScope(request.item, scope);

  return request;
}

export const approve = async (idParam, payload, currentUser) => {
  const scope = await resolveInventoryScope(currentUser);
  const request = await resolveRequestOrFail(idParam, scope);

  if (request.status !== 'PENDING') {
    throw new AppError('La solicitud ya fue procesada', 409);
  }

  const snapshot = request.snapshot || {};
  const reviewedAt = new Date();
  const reviewNotes =
    typeof payload?.review_notes === 'string' ? payload.review_notes.trim() : null;

  const { updatedItem, updatedRequest } = await runWithActivityLoggingSuppressed(
    ['inventory_items', 'inventory_item_devices', 'inventory_transfer_requests'],
    () =>
      prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "inventory_items" WHERE id = ${request.item_id} FOR UPDATE`;

        const item = await tx.inventory_items.findUnique({
          where: { id: request.item_id },
          include: includeRelations,
        });

        if (!item) {
          throw new AppError('Bien no encontrado', 404);
        }

        assertInventoryItemInScope(item, scope);

        const nextAdministrativeAreaId = resolveSnapshotAdministrativeArea(
          snapshot,
          item.id_administrative_area
        );

        if (nextAdministrativeAreaId !== null) {
          const administrativeArea = await tx.inventory_administrative_areas.findUnique({
            where: { id: nextAdministrativeAreaId },
            select: { id: true },
          });

          if (!administrativeArea) {
            throw new AppError('Área administradora destino no encontrada', 400);
          }
        }

        const claimedRequest = await tx.inventory_transfer_requests.updateMany({
          where: { id: request.id, status: 'PENDING' },
          data: {
            status: 'APPROVED',
            approver_id: currentUser?.id ?? null,
            review_notes: reviewNotes,
            reviewed_at: reviewedAt,
          },
        });

        if (claimedRequest.count !== 1) {
          throw new AppError('La solicitud ya fue procesada', 409);
        }

        const clearAssignedUser = shouldClearAssignedUser(snapshot);
        const assignedUser =
          typeof snapshot.userRecibe === 'string' ? snapshot.userRecibe.trim() : '';
        const nextUser = clearAssignedUser
          ? null
          : assignedUser || snapshot.userName || item.user;

        const nextItem = await tx.inventory_items.update({
          where: { id: request.item_id },
          data: {
            id_ubication: snapshot.ubication_destino_id ?? item.id_ubication,
            id_department: snapshot.department_destino_id ?? item.id_department,
            id_administrative_area: nextAdministrativeAreaId,
            user: nextUser,
            transferdate: new Date(),
            observation: snapshot.observation ?? item.observation,
            updated_by: currentUser?.id ?? null,
          },
          include: includeRelations,
        });

        const nextRequest = await tx.inventory_transfer_requests.findUnique({
          where: { id: request.id },
          include: {
            requester: userSummarySelect,
            approver: userSummarySelect,
          },
        });

        await writeInventoryAuditEvent(tx, {
          action: 'UPDATE',
          oldRecord: item,
          newRecord: nextItem,
          userId: currentUser?.id,
          source: 'inventory_transfer_requests.approve',
          metadata: {
            transfer_snapshot: snapshot,
            transfer_request_id: request.id,
            transfer_requester_id: request.requester_id,
            transfer_requester_name:
              request.requester?.nombre_completo || request.requester?.username || null,
          },
        });

        const context = activityContext.getStore();
        await tx.activity_logs.create({
          data: {
            entity_type: 'INVENTORY_TRANSFER_REQUESTS',
            entity_id: request.id,
            action: 'UPDATE',
            old_values: {
              status: request.status,
              approver_id: request.approver_id,
              review_notes: request.review_notes,
              reviewed_at: request.reviewed_at,
            },
            new_values: {
              status: nextRequest.status,
              approver_id: nextRequest.approver_id,
              review_notes: nextRequest.review_notes,
              reviewed_at: nextRequest.reviewed_at,
            },
            user_id: currentUser?.id ?? null,
            ip_address: context?.ipAddress ?? null,
            user_agent: context?.userAgent ?? null,
            source: 'inventory_transfer_requests.approve',
          },
        });

        return { updatedItem: nextItem, updatedRequest: nextRequest };
      })
  );

  return {
    success: true,
    message: 'Traslado aprobado',
    request: {
      ...updatedRequest,
      preview_inventory: mapInventoryItem(updatedItem),
    },
  };
};

export const reject = async (idParam, payload, currentUser, nextStatus = 'REJECTED') => {
  const scope = await resolveInventoryScope(currentUser);
  const request = await resolveRequestOrFail(idParam, scope);

  if (request.status !== 'PENDING') {
    throw new AppError('La solicitud ya fue procesada', 409);
  }

  const reviewNotes =
    typeof payload?.review_notes === 'string' ? payload.review_notes.trim() : null;

  const claimedRequest = await prisma.inventory_transfer_requests.updateMany({
    where: { id: request.id, status: 'PENDING' },
    data: {
      status: nextStatus,
      approver_id: currentUser?.id ?? null,
      review_notes: reviewNotes,
      reviewed_at: new Date(),
    },
  });

  if (claimedRequest.count !== 1) {
    throw new AppError('La solicitud ya fue procesada', 409);
  }

  const updatedRequest = await prisma.inventory_transfer_requests.findUnique({
    where: { id: request.id },
    include: {
      requester: userSummarySelect,
      approver: userSummarySelect,
    },
  });

  return {
    success: true,
    message:
      nextStatus === 'CORRECTION_REQUESTED'
        ? 'Se solicitó corrección del traslado'
        : 'Traslado rechazado',
    request: updatedRequest,
  };
};
