import AppError from '../../common/utils/AppError.js';
import * as repository from './activity.repository.js';
import { buildDiff } from './activity.resolver.js';

const ENTITY_LABELS = {
  BD_INCIDENTS: 'Incidente',
  BD_INVENTORY: 'Inventario',
  TONER_MOVEMENTS: 'Movimiento de tóner',
  TONERS: 'Tóner',
  USERS: 'Usuario',
  DEPARTMENTS: 'Departamento'
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parsePagination(query) {
  const page = Number(query?.page) || DEFAULT_PAGE;
  const requestedLimit = Number(query?.limit) || DEFAULT_LIMIT;
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Página inválida', 400);
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Límite inválido', 400);
  }

  return { page, limit };
}

function parseOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} inválido`, 400);
  }

  return parsed;
}

function parseOptionalDate(value, fieldName) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} inválida`, 400);
  }

  return parsed;
}

function buildFilters(query) {
  const entityType = String(query?.entityType || '').trim().toUpperCase() || null;
  const action = String(query?.action || '').trim().toUpperCase() || null;
  const entityId = parseOptionalPositiveInt(query?.entityId, 'ID de entidad');
  const userId = parseOptionalPositiveInt(query?.userId, 'ID de usuario');
  const from = parseOptionalDate(query?.from, 'Fecha inicial');
  const to = parseOptionalDate(query?.to, 'Fecha final');

  if (from) {
    from.setHours(0, 0, 0, 0);
  }
  if (to) {
    to.setHours(23, 59, 59, 999);
  }

  if (from && to && from > to) {
    throw new AppError('La fecha inicial no puede ser mayor que la final', 400);
  }

  return {
    entityType,
    action,
    entityId,
    userId,
    from,
    to
  };
}

async function formatLog(log) {
  return {
    id: log.id,
    entityType: log.entity_type,
    entityLabel: ENTITY_LABELS[log.entity_type] || log.entity_type,
    entityId: log.entity_id,
    action: log.action,
    user: log.user
      ? {
          id: log.user.id,
          name: log.user.nombre_completo
        }
      : null,
    ipAddress: log.ip_address,
    createdAt: log.created_at,
    diff: await buildDiff(log.old_values, log.new_values, log.action)
  };
}

export const getAll = async (query) => {
  const { page, limit } = parsePagination(query);
  const filters = buildFilters(query);

  const result = await repository.getActivityLogs({
    page,
    limit,
    ...filters
  });

  const data = await Promise.all(result.data.map(formatLog));

  return {
    data,
    total: result.total,
    page,
    totalPages: Math.max(Math.ceil(result.total / limit), 1)
  };
};
