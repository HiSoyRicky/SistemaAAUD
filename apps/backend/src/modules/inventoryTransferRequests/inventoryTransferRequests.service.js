import AppError from '../../common/utils/AppError.js';
import { prisma } from '../../config/prisma.js';
import { mapInventoryItem } from '../inventory/inventory.dto.js';

function parseId(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} inválido`, 400);
  }

  return parsed;
}

function normalizeStatus(status) {
  const value = String(status || '').trim().toUpperCase();
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

function buildPreviewInventory(request, inventory) {
  const snapshot = request.snapshot || {};

  return mapInventoryItem({
    ...inventory,
    ubications: { name: snapshot.ubication_destino_name || inventory.ubications?.name || null },
    departments: { name: snapshot.department_destino_name || inventory.departments?.name || null },
    devices: inventory.devices,
    brands: inventory.brands,
    models: inventory.models,
    status: inventory.status,
    tag: snapshot.tag || inventory.tag,
    user: snapshot.userRecibe || snapshot.userName || inventory.user,
    serie: snapshot.serie || inventory.serie,
    ip: snapshot.ip || inventory.ip,
    transferdate: inventory.transferdate,
    observation: snapshot.observation || inventory.observation,
    id_ubication: snapshot.ubication_destino_id ?? inventory.id_ubication,
    id_department: snapshot.department_destino_id ?? inventory.id_department,
    id_device: inventory.id_device,
    id_brand: inventory.id_brand,
    id_model: inventory.id_model,
    id_status: inventory.id_status
  });
}

export const getAll = async (query = {}) => {
  const status = normalizeStatus(query.status);

  const where = {
    ...(status ? { status } : {})
  };

  const requests = await prisma.inventory_transfer_requests.findMany({
    where,
    orderBy: { requested_at: 'desc' },
    include: {
      inventory: {
        include: {
          devices: { select: { id: true, name: true } },
          brands: { select: { id: true, name: true } },
          models: { select: { id: true, name: true } },
          departments: { select: { id: true, name: true } },
          ubications: { select: { id: true, name: true } },
          status: { select: { id: true, name: true } }
        }
      },
      requester: { select: { id: true, nombre_completo: true, username: true } },
      approver: { select: { id: true, nombre_completo: true, username: true } }
    }
  });

  return {
    data: requests.map((request) => ({
      ...request,
      inventory_snapshot: request.inventory ? mapInventoryItem(request.inventory) : null,
      preview_inventory: request.inventory ? buildPreviewInventory(request, request.inventory) : null
    }))
  };
};

export const getMine = async (query = {}, currentUser) => {
  const requesterId = parseId(currentUser?.id, 'ID de usuario');
  const status = normalizeStatus(query.status);

  const requests = await prisma.inventory_transfer_requests.findMany({
    where: {
      requester_id: requesterId,
      ...(status ? { status } : {})
    },
    orderBy: { requested_at: 'desc' },
    include: {
      inventory: {
        include: {
          devices: { select: { id: true, name: true } },
          brands: { select: { id: true, name: true } },
          models: { select: { id: true, name: true } },
          departments: { select: { id: true, name: true } },
          ubications: { select: { id: true, name: true } },
          status: { select: { id: true, name: true } }
        }
      },
      requester: { select: { id: true, nombre_completo: true, username: true } },
      approver: { select: { id: true, nombre_completo: true, username: true } }
    }
  });

  return {
    data: requests.map((request) => ({
      ...request,
      inventory_snapshot: request.inventory ? mapInventoryItem(request.inventory) : null,
      preview_inventory: request.inventory ? buildPreviewInventory(request, request.inventory) : null
    }))
  };
};

export const create = async (payload, currentUser) => {
  const inventoryId = parseId(payload?.inventory_id, 'ID de inventario');
  const snapshot = payload?.snapshot && typeof payload.snapshot === 'object' ? payload.snapshot : null;

  if (!snapshot) {
    throw new AppError('La información del traslado es obligatoria', 400);
  }

  const inventory = await prisma.bd_inventory.findUnique({
    where: { id: inventoryId },
    include: {
      devices: { select: { id: true, name: true } },
      brands: { select: { id: true, name: true } },
      models: { select: { id: true, name: true } },
      departments: { select: { id: true, name: true } },
      ubications: { select: { id: true, name: true } },
      status: { select: { id: true, name: true } }
    }
  });

  if (!inventory) {
    throw new AppError('Equipo no encontrado', 404);
  }

  const pendingRequest = await prisma.inventory_transfer_requests.findFirst({
    where: {
      inventory_id: inventoryId,
      status: 'PENDING'
    }
  });

  if (pendingRequest) {
    throw new AppError('Ya existe una solicitud pendiente para este equipo', 409);
  }

  const created = await prisma.inventory_transfer_requests.create({
    data: {
      inventory_id: inventoryId,
      requester_id: Number(currentUser?.id),
      snapshot
    },
    include: {
      requester: { select: { id: true, nombre_completo: true, username: true } }
    }
  });

  return {
    success: true,
    message: 'Solicitud de traslado creada',
    request: created
  };
};

async function resolveRequestOrFail(idParam) {
  const id = parseId(idParam, 'ID de solicitud');

  const request = await prisma.inventory_transfer_requests.findUnique({
    where: { id },
    include: {
      inventory: {
        include: {
          devices: { select: { id: true, name: true } },
          brands: { select: { id: true, name: true } },
          models: { select: { id: true, name: true } },
          departments: { select: { id: true, name: true } },
          ubications: { select: { id: true, name: true } },
          status: { select: { id: true, name: true } }
        }
      },
      requester: { select: { id: true, nombre_completo: true, username: true } },
      approver: { select: { id: true, nombre_completo: true, username: true } }
    }
  });

  if (!request) {
    throw new AppError('Solicitud no encontrada', 404);
  }

  return request;
}

export const approve = async (idParam, payload, currentUser) => {
  const request = await resolveRequestOrFail(idParam);

  if (request.status !== 'PENDING') {
    throw new AppError('La solicitud ya fue procesada', 409);
  }

  const snapshot = request.snapshot || {};
  const inventory = request.inventory;
  const reviewedAt = new Date();
  const reviewNotes = typeof payload?.review_notes === 'string' ? payload.review_notes.trim() : null;
  const clearAssignedUser = shouldClearAssignedUser(snapshot);
  const assignedUser = typeof snapshot.userRecibe === 'string' ? snapshot.userRecibe.trim() : '';
  const nextUser = clearAssignedUser ? null : (assignedUser || snapshot.userName || inventory.user);

  const { updatedInventory, updatedRequest } = await prisma.$transaction(async (tx) => {
    const nextInventory = await tx.bd_inventory.update({
      where: { id: request.inventory_id },
      data: {
        id_ubication: snapshot.ubication_destino_id ?? inventory.id_ubication,
        id_department: snapshot.department_destino_id ?? inventory.id_department,
        user: nextUser,
        transferdate: new Date(),
        observation: snapshot.observation ?? inventory.observation,
        updated_by: currentUser?.id ?? null
      },
      include: {
        devices: { select: { id: true, name: true } },
        brands: { select: { id: true, name: true } },
        models: { select: { id: true, name: true } },
        departments: { select: { id: true, name: true } },
        ubications: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } }
      }
    });

    const nextRequest = await tx.inventory_transfer_requests.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        approver_id: currentUser?.id ?? null,
        review_notes: reviewNotes,
        reviewed_at: reviewedAt
      },
      include: {
        requester: { select: { id: true, nombre_completo: true, username: true } },
        approver: { select: { id: true, nombre_completo: true, username: true } }
      }
    });

    await tx.activity_logs.create({
      data: {
        entity_type: 'BD_INVENTORY',
        entity_id: request.inventory_id,
        action: 'UPDATE',
        old_values: inventory,
        new_values: {
          ...nextInventory,
          transfer_snapshot: snapshot,
          transfer_request_id: request.id,
          transfer_requester_id: request.requester_id,
          transfer_requester_name:
            request.requester?.nombre_completo ||
            request.requester?.username ||
            null
        },
        user_id: currentUser?.id ?? null,
        source: 'inventory_transfer_requests.approve'
      }
    });

    return { updatedInventory: nextInventory, updatedRequest: nextRequest };
  });

  return {
    success: true,
    message: 'Traslado aprobado',
    request: {
      ...updatedRequest,
      preview_inventory: mapInventoryItem(updatedInventory)
    }
  };
};

export const reject = async (idParam, payload, currentUser, nextStatus = 'REJECTED') => {
  const request = await resolveRequestOrFail(idParam);

  if (request.status !== 'PENDING') {
    throw new AppError('La solicitud ya fue procesada', 409);
  }

  const reviewNotes = typeof payload?.review_notes === 'string' ? payload.review_notes.trim() : null;

  const updatedRequest = await prisma.inventory_transfer_requests.update({
    where: { id: request.id },
    data: {
      status: nextStatus,
      approver_id: currentUser?.id ?? null,
      review_notes: reviewNotes,
      reviewed_at: new Date()
    },
    include: {
      requester: { select: { id: true, nombre_completo: true, username: true } },
      approver: { select: { id: true, nombre_completo: true, username: true } }
    }
  });

  return {
    success: true,
    message: nextStatus === 'CORRECTION_REQUESTED'
      ? 'Se solicitó corrección del traslado'
      : 'Traslado rechazado',
    request: updatedRequest
  };
};
