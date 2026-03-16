import AppError from '../../common/utils/AppError.js';
import * as repository from './toners.repository.js';
import * as dto from './toners.dto.js';
import { TONER_COLORS, DEFAULT_MIN_STOCK } from './toners.constants.js';

function parseId(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('ID inválido', 400);
  }
  return id;
}

function parsePrinterModelId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Modelo de impresora inválido', 400);
  }
  return parsed;
}

function parseMinStock(value, fallback = DEFAULT_MIN_STOCK) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError('El stock mínimo debe ser un número válido', 400);
  }

  return parsed;
}

function parseColor(color) {
  const normalized = String(color || '').toUpperCase().trim();
  if (!TONER_COLORS.includes(normalized)) {
    throw new AppError('Color de tóner inválido', 400);
  }
  return normalized;
}

function parseTonerModel(payload, { required }) {
  const source = payload.toner_model ?? payload.name;

  if (!source && required) {
    throw new AppError('El modelo de tóner es requerido', 400);
  }

  if (source === undefined) {
    return undefined;
  }

  const value = String(source).trim();
  if (!value) {
    throw new AppError('El modelo de tóner es requerido', 400);
  }

  return value;
}

async function ensurePrinterModelExists(id_printer_model) {
  const printerModel = await repository.findPrinterModelById(id_printer_model);

  if (!printerModel) {
    throw new AppError('Modelo de impresora inválido', 400);
  }
}

export const getAll = async () => {
  const toners = await repository.findAll();
  return toners.map(dto.mapTonerListItem);
};

export const create = async (payload) => {
  const id_printer_model = parsePrinterModelId(payload.id_printer_model);
  const min_stock = parseMinStock(payload.min_stock);
  const color = parseColor(payload.color);
  const toner_model = parseTonerModel(payload, { required: true });

  await ensurePrinterModelExists(id_printer_model);

  const created = await repository.createWithStock({
    toner_model,
    color,
    id_printer_model,
    min_stock
  });

  return dto.mapCreatedTonerResponse(created);
};

export const update = async (idParam, payload) => {
  const id = parseId(idParam);
  const toner = await repository.findById(id);

  if (!toner) {
    throw new AppError('Tóner no encontrado', 404);
  }

  const data = {};

  if (payload.toner_model !== undefined || payload.name !== undefined) {
    data.toner_model = parseTonerModel(payload, { required: true });
  }

  if (payload.color !== undefined) {
    data.color = parseColor(payload.color);
  }

  if (payload.min_stock !== undefined) {
    data.min_stock = parseMinStock(payload.min_stock, toner.min_stock);
  }

  if (payload.id_printer_model !== undefined) {
    const id_printer_model = parsePrinterModelId(payload.id_printer_model);
    await ensurePrinterModelExists(id_printer_model);
    data.id_printer_model = id_printer_model;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  const updated = await repository.updateById(id, data);
  return dto.mapUpdatedTonerResponse(updated);
};

export const remove = async (idParam) => {
  const id = parseId(idParam);
  const toner = await repository.findById(id);

  if (!toner) {
    throw new AppError('Tóner no encontrado', 404);
  }

  const movementCount = await repository.countMovementsByTonerId(id);
  if (movementCount > 0) {
    throw new AppError('No se puede eliminar un tóner con movimientos asociados', 409);
  }

  await repository.deleteByIdWithStock(id);
  return dto.mapDeletedTonerResponse();
};
