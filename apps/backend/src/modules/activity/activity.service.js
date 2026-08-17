// activity.service.js

import AppError from '../../common/utils/AppError.js';
import * as repository from './activity.repository.js';
import { buildDiff, buildRecordLabel } from './activity.resolver.js';

const ENTITY_LABELS = {
  BD_INCIDENTS: 'Incidente',
  BD_INVENTORY: 'Inventario',
  TONER_MOVEMENTS: 'Movimiento de tóner',
  TONERS: 'Tóner',
  TONER_STOCK: 'Stock de tóner',
  USERS: 'Usuario',
  DEPARTMENTS: 'Departamento',
  MODELS: 'Modelo',
  BRANDS: 'Marca',
  CATEGORIES: 'Categoría',
  DEVICES: 'Tipo de equipo',
  STATUS: 'Estado',
  UBICATIONS: 'Ubicación',
  ROLES: 'Rol',
  PERMISSIONS: 'Permiso',
  ROLE_PERMISSIONS: 'Permisos de rol',
  USER_PERMISSIONS: 'Permisos de usuario',
  INVENTORY_TRANSFER_REQUESTS: 'Solicitud de traslado',
  bd_incidents: 'Incidente',
  bd_inventory: 'Inventario',
  toner_movements: 'Movimiento de tóner',
  toners: 'Tóner',
  toner_stock: 'Stock de tóner',
  users: 'Usuario',
  departments: 'Departamento',
  models: 'Modelo',
  brands: 'Marca',
  categories: 'Categoría',
  devices: 'Tipo de equipo',
  status: 'Estado',
  ubications: 'Ubicación',
  roles: 'Rol',
  permissions: 'Permiso',
  role_permissions: 'Permisos de rol',
  user_permissions: 'Permisos de usuario',
  inventory_transfer_requests: 'Solicitud de traslado',
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const SUMMARY_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];
const ENTITY_ALIASES = {
  BD_INCIDENTS: ['BD_INCIDENTS', 'bd_incidents'],
  BD_INVENTORY: ['BD_INVENTORY', 'bd_inventory'],
  TONER_MOVEMENTS: ['TONER_MOVEMENTS', 'toner_movements'],
  TONERS: ['TONERS', 'toners'],
  TONER_STOCK: ['TONER_STOCK', 'toner_stock'],
  USERS: ['USERS', 'users'],
  DEPARTMENTS: ['DEPARTMENTS', 'departments'],
  MODELS: ['MODELS', 'models'],
  BRANDS: ['BRANDS', 'brands'],
  CATEGORIES: ['CATEGORIES', 'categories'],
  DEVICES: ['DEVICES', 'devices'],
  STATUS: ['STATUS', 'status'],
  UBICATIONS: ['UBICATIONS', 'ubications'],
  ROLES: ['ROLES', 'roles'],
  PERMISSIONS: ['PERMISSIONS', 'permissions'],
  ROLE_PERMISSIONS: ['ROLE_PERMISSIONS', 'role_permissions'],
  USER_PERMISSIONS: ['USER_PERMISSIONS', 'user_permissions'],
  INVENTORY_TRANSFER_REQUESTS: [
    'INVENTORY_TRANSFER_REQUESTS',
    'inventory_transfer_requests',
  ],
};

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
  const rawEntityType =
    String(query?.entityType || '')
      .trim()
      .toUpperCase() || null;
  const entityTypes = rawEntityType ? ENTITY_ALIASES[rawEntityType] || [rawEntityType] : null;
  const action =
    String(query?.action || '')
      .trim()
      .toUpperCase() || null;
  const entityId = parseOptionalPositiveInt(query?.entityId, 'ID de entidad');
  const userId = parseOptionalPositiveInt(query?.userId, 'ID de usuario');
  const userName =
    String(query?.userName || query?.user || '')
      .trim() || null;
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
    entityType: rawEntityType,
    entityTypes,
    action,
    entityId,
    userId,
    userName,
    from,
    to,
  };
}

async function formatLog(log) {
  return {
    id: log.id,
    entityType: log.entity_type,
    entityLabel: ENTITY_LABELS[log.entity_type] || log.entity_type,
    entityId: log.entity_id,
    recordLabel: await buildRecordLabel(
      log.entity_type,
      log.entity_id,
      log.old_values,
      log.new_values
    ),
    action: log.action,
    user: log.user
      ? {
          id: log.user.id,
          name: log.user.nombre_completo,
        }
      : null,
    ipAddress: log.ip_address,
    createdAt: log.created_at,
    diff: await buildDiff(log.old_values, log.new_values, log.action, log.entity_type),
  };
}

function formatSummary(summary = {}) {
  return SUMMARY_ACTIONS.reduce((formatted, action) => {
    formatted[action] = Number(summary[action]) || 0;
    return formatted;
  }, {});
}

export const getAll = async (query) => {
  const { page, limit } = parsePagination(query);
  const filters = buildFilters(query);

  const result = await repository.getActivityLogs({
    page,
    limit,
    ...filters,
  });

  const data = await Promise.all(result.data.map(formatLog));

  return {
    data,
    total: result.total,
    page,
    totalPages: Math.max(Math.ceil(result.total / limit), 1),
    summary: formatSummary(result.summary),
  };
};
