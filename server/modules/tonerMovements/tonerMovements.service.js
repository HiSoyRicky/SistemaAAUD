import AppError from '../../utils/AppError.js';
import * as repository from './tonerMovements.repository.js';
import * as dto from './tonerMovements.dto.js';
import { MOVEMENT_TYPES,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_RECEIVER_NAME_LENGTH,
  MIN_ADJUSTMENT_REFERENCE_LENGTH,
  DOCUMENT_STATUS_SIGNED } from './tonerMovements.constants.js';

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} inválido`, 400);
  }
  return parsed;
}

function parseOptionalPositiveInt(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('ID inválido', 400);
  }

  return parsed;
}

function parsePagination(query) {
  const page = Number(query.page) || DEFAULT_PAGE;
  const requestedLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  if (page < 1) {
    throw new AppError('Página inválida', 400);
  }

  if (limit < 1) {
    throw new AppError('Límite inválido', 400);
  }

  return { page, limit };
}

function buildMovementWhere(query) {
  const where = {};
  const idToner = parseOptionalPositiveInt(query.id_toner);

  if (idToner) {
    where.id_toner = idToner;
  }

  const searchTerm = String(query.search || '').trim();
  if (searchTerm) {
    where.OR = [
      {
        toner: {
          is: {
            toner_model: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        }
      },
      {
        reference: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        receiver_name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      {
        department: {
          is: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        }
      },
      {
        ubication: {
          is: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        }
      }
    ];
  }

  return where;
}

function parseMovementType(value) {
  const movementType = String(value || '').toUpperCase().trim();
  if (!MOVEMENT_TYPES.includes(movementType)) {
    throw new AppError('Tipo de movimiento inválido', 400);
  }
  return movementType;
}

function parseUserContext(currentUser) {
  const userId = Number(currentUser?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('No autenticado', 401);
  }

  return { userId };
}

export const getAll = async (query) => {
  const { page, limit } = parsePagination(query);
  const where = buildMovementWhere(query);

  const data = await repository.findMovements({
    where,
    skip: (page - 1) * limit,
    take: limit
  });

  const total = await repository.countMovements(where);

  return dto.mapMovementsPaginatedResponse({
    data,
    total,
    page,
    limit
  });
};

export const create = async ({ payload, currentUser }) => {
  const { userId } = parseUserContext(currentUser);
  const id_toner = parsePositiveInt(payload.id_toner, 'Tóner');
  const quantity = parsePositiveInt(payload.quantity, 'Cantidad');
  const movement_type = parseMovementType(payload.movement_type);

  const id_department = parseOptionalPositiveInt(payload.id_department);
  const id_ubication = parseOptionalPositiveInt(payload.id_ubication);
  const id_incident = parseOptionalPositiveInt(payload.id_incident);

  const receiverName = payload.receiver_name
    ? String(payload.receiver_name).trim()
    : '';
  const reference = payload.reference ? String(payload.reference).trim() : '';

  const movement = await repository.withTransaction(async (tx) => {
    const toner = await repository.findTonerByIdWithStock(id_toner, tx);

    if (!toner) {
      throw new AppError('Tóner no encontrado', 404);
    }

    const currentStock = toner.stock?.quantity ?? 0;
    let newStock = currentStock;
    let finalReference = reference || null;

    if (movement_type === 'IN') {
      newStock = currentStock + quantity;
    }

    if (movement_type === 'OUT') {
      if (!id_department || !id_ubication) {
        throw new AppError('Salida requiere ubicación y departamento', 400);
      }

      if (receiverName.length < MIN_RECEIVER_NAME_LENGTH) {
        throw new AppError('Debe indicar el nombre de quien retira', 400);
      }

      const department = await repository.findDepartmentById(id_department, tx);
      if (!department || department.id_ubication !== id_ubication) {
        throw new AppError(
          'Departamento no pertenece a la ubicación seleccionada',
          400
        );
      }

      if (quantity > currentStock) {
        throw new AppError('Stock insuficiente', 400);
      }

      newStock = currentStock - quantity;
    }

    if (movement_type === 'ADJUSTMENT') {

      if (reference.length < MIN_ADJUSTMENT_REFERENCE_LENGTH) {
        throw new AppError('Debe indicar el motivo detallado del ajuste', 400);
      }

      newStock = quantity;
      const difference = newStock - currentStock;
      finalReference = `AJUSTE (${difference >= 0 ? '+' : ''}${difference}) - ${reference}`;
    }

    await repository.upsertTonerStock(
      {
        tonerId: id_toner,
        quantity: newStock
      },
      tx
    );

    return repository.createMovement(
      {
        id_toner,
        movement_type,
        quantity,
        previous_stock: currentStock,
        new_stock: newStock,
        reference: finalReference,
        id_department,
        id_ubication,
        id_incident,
        receiver_name: movement_type === 'OUT' ? receiverName : null,
        id_user: userId,
        created_by: userId
      },
      tx
    );
  });

  return dto.mapCreateMovementResponse(movement);
};

export const uploadDocument = async ({ idParam, file, currentUser }) => {
  const movementId = parsePositiveInt(idParam, 'ID');
  const uploadedBy = Number(currentUser?.id) || null;

  if (!file) {
    throw new AppError('Archivo requerido', 400);
  }

  const movement = await repository.findMovementById(movementId);
  if (!movement) {
    throw new AppError('Movimiento no encontrado', 404);
  }

  const updated = await repository.updateMovementDocument({
    movementId,
    data: {
      signed_document: file.filename,
      document_status: DOCUMENT_STATUS_SIGNED,
      document_uploaded_at: new Date(),
      document_uploaded_by: uploadedBy
    }
  });

  return dto.mapUploadDocumentResponse(updated);
};
