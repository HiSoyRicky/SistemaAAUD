// inventory.parsers.js

import AppError from '../../../common/utils/AppError.js';
import { parseDateOnly } from '../../../common/utils/dateParser.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/inventory.constants.js';

function isDiscardedStatus(statusName) {
  return normalizeText(statusName) === 'DESCARTADO';
}

function sanitizeMovementValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'object') {
    return (
      value.name || value.label || value.title || value.nombre_completo || value.username || null
    );
  }

  return value;
}

function parseMovementObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function parseIntSafe(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseOptionalPositiveInt(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return Number.NaN;
  }

  return parsed;
}

function parseRequiredPositiveInt(value) {
  const parsed = parseOptionalPositiveInt(value);
  return parsed === null ? Number.NaN : parsed;
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

function parseTransferDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return parseDateOnly(value.trim());
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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

function parseNullableId(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeComparableValue(value) {
  if (value === undefined || value === null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function formatHistoryDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return sanitizeMovementValue(value);

  return new Intl.DateTimeFormat('es-PA', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

export {
  formatHistoryDate,
  isDiscardedStatus,
  normalizeComparableValue,
  normalizeText,
  parseIntSafe,
  parseMovementObject,
  parseNullableId,
  parseOptionalDate,
  parseOptionalPositiveInt,
  parsePagination,
  parseRequiredPositiveInt,
  parseTransferDate,
  sanitizeMovementValue,
  toTimestamp,
};
