import AppError from '../../common/utils/AppError.js';
import * as dto from './warehouse.dto.js';
import * as repository from './warehouse.repository.js';

const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];
const CATEGORY_OPTIONS = new Set([
  'Alimentos y bebidas',
  'Combustibles y gases',
  'Cocina y comedor',
  'Electricidad y electrónica',
  'Ferretería, construcción y pintura',
  'Herramientas y equipos',
  'HVAC y climatización',
  'Informática y comunicaciones',
  'Jardinería y agricultura',
  'Limpieza e higiene',
  'Llantas y ruedas',
  'Lubricantes y fluidos',
  'Mobiliario y enseres',
  'Médico y laboratorio',
  'Papelería y útiles',
  'Repuestos y componentes',
  'Ropa y uniformes',
  'Seguridad y protección',
  'Vehículos y transporte',
]);
const UNIT_OPTIONS = new Set(['BID', 'BOL', 'BTO', 'C/U', 'CA', 'CJ', 'CTO', 'DOC', 'FRC', 'GLN', 'GRF', 'KG', 'L', 'LB', 'LTA', 'M', 'M2', 'M3', 'MLR', 'PAA', 'PAQ', 'PIE', 'PLG', 'PT', 'RES', 'ROL', 'SAC', 'TF', 'TRA', 'TUB', 'YD']);
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} inválido`, 400);
  }
  return parsed;
}

function parseOptionalPositiveInt(value, fieldName = 'ID') {
  if (value === undefined || value === null || value === '') return null;
  return parsePositiveInt(value, fieldName);
}

function parsePagination(query = {}) {
  const page = Number(query.page) || DEFAULT_PAGE;
  const requestedLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  if (!Number.isInteger(page) || page < 1) throw new AppError('Página inválida', 400);
  if (!Number.isInteger(limit) || limit < 1) throw new AppError('Límite inválido', 400);

  return { page, limit, skip: (page - 1) * limit };
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeRequiredText(value, fieldName) {
  const text = normalizeOptionalText(value);
  if (!text) throw new AppError(`${fieldName} es requerido`, 400);
  return text;
}

function parseUnit(value) {
  const unit = normalizeRequiredText(value, 'La unidad');
  if (!UNIT_OPTIONS.has(unit)) throw new AppError('La unidad seleccionada no es válida', 400);
  return unit;
}

function parseCategory(value) {
  const category = normalizeOptionalText(value);
  if (category !== null && !CATEGORY_OPTIONS.has(category)) {
    throw new AppError('La categoría seleccionada no es válida', 400);
  }
  return category;
}

function parseItemData(payload, { partial = false } = {}) {
  const data = {};

  if (!partial || payload.code !== undefined) data.code = normalizeOptionalText(payload.code);
  if (!partial || payload.name !== undefined) data.name = normalizeRequiredText(payload.name, 'El nombre');
  if (!partial || payload.unit !== undefined) data.unit = parseUnit(payload.unit);
  if (!partial || payload.category !== undefined) {
    data.category = parseCategory(payload.category);
  }
  if (!partial || payload.min_stock !== undefined) {
    const value = payload.min_stock === undefined || payload.min_stock === null || payload.min_stock === ''
      ? 0
      : Number(payload.min_stock);
    if (!Number.isInteger(value) || value < 0) throw new AppError('El stock mínimo debe ser válido', 400);
    data.min_stock = value;
  }
  if (!partial || payload.active !== undefined) {
    data.active = payload.active === undefined ? true : Boolean(payload.active);
  }

  return data;
}

function buildItemWhere(query = {}) {
  const search = normalizeOptionalText(query.search);
  const category = normalizeOptionalText(query.category);
  const where = {
    ...(query.active !== undefined && { active: query.active === true || query.active === 'true' }),
    ...(category && { category: { equals: category, mode: 'insensitive' } }),
  };

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildStockWhere(query = {}) {
  const itemId = parseOptionalPositiveInt(query.item_id, 'Insumo');
  const ubicationId = parseOptionalPositiveInt(query.ubication_id, 'Ubicación');

  const search = normalizeOptionalText(query.search);
  const where = {
    ...(itemId && { item_id: itemId }),
    ...(ubicationId && { ubication_id: ubicationId }),
  };

  if (search) {
    where.OR = [
      { item: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { item: { is: { code: { contains: search, mode: 'insensitive' } } } },
      { ubication: { is: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

function buildMovementWhere(query = {}) {
  const itemId = parseOptionalPositiveInt(query.item_id, 'Insumo');
  const ubicationId = parseOptionalPositiveInt(query.ubication_id, 'Ubicación');
  const departmentId = parseOptionalPositiveInt(query.department_id, 'Departamento');
  const movementType = normalizeOptionalText(query.movement_type)?.toUpperCase();
  const search = normalizeOptionalText(query.search);
  const from = normalizeOptionalText(query.from);
  const to = normalizeOptionalText(query.to);

  if (movementType && !MOVEMENT_TYPES.includes(movementType)) {
    throw new AppError('Tipo de movimiento inválido', 400);
  }

  const where = {
    ...(itemId && { item_id: itemId }),
    ...(ubicationId && { ubication_id: ubicationId }),
    ...(departmentId && { department_id: departmentId }),
    ...(movementType && { movement_type: movementType }),
    ...((from || to) && {
      created_at: {
        ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
        ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
      },
    }),
  };

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { receiver_name: { contains: search, mode: 'insensitive' } },
      { observation: { contains: search, mode: 'insensitive' } },
      { item: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { item: { is: { code: { contains: search, mode: 'insensitive' } } } },
      { ubication: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { department: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { user: { is: { nombre_completo: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

export const listItems = async (query = {}) => {
  const pagination = parsePagination(query);
  const where = buildItemWhere(query);
  const [items, total] = await Promise.all([
    repository.findItems({ where, skip: pagination.skip, take: pagination.limit }),
    repository.countItems(where),
  ]);
  return dto.mapPaginated({
    data: items.map(dto.mapItem),
    total,
    page: pagination.page,
    limit: pagination.limit,
  });
};

export const createItem = async (payload) => {
  try {
    return dto.mapItem(await repository.createItem(parseItemData(payload)));
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('Ya existe un insumo con ese código o nombre', 409);
    throw error;
  }
};

export const updateItem = async (idParam, payload) => {
  const id = parsePositiveInt(idParam, 'Insumo');
  const existing = await repository.findItemById(id);
  if (!existing) throw new AppError('Insumo no encontrado', 404);

  const data = parseItemData(payload, { partial: true });
  if (Object.keys(data).length === 0) throw new AppError('No hay campos para actualizar', 400);

  try {
    return dto.mapItem(await repository.updateItem(id, data));
  } catch (error) {
    if (error.code === 'P2002') throw new AppError('Ya existe un insumo con ese código o nombre', 409);
    throw error;
  }
};

export const listStock = async (query = {}) => {
  const pagination = parsePagination(query);
  const where = buildStockWhere(query);
  const [stock, total] = await Promise.all([
    repository.findStock({ where, skip: pagination.skip, take: pagination.limit }),
    repository.countStock(where),
  ]);
  return dto.mapPaginated({
    data: stock.map(dto.mapStock),
    total,
    page: pagination.page,
    limit: pagination.limit,
  });
};

export const listMovements = async (query = {}) => {
  const pagination = parsePagination(query);
  const where = buildMovementWhere(query);
  const [movements, total, summary] = await Promise.all([
    repository.findMovements({ where, skip: pagination.skip, take: pagination.limit }),
    repository.countMovements(where),
    repository.summarizeMovements(where),
  ]);
  return dto.mapPaginated({
    data: movements.map(dto.mapMovement),
    total,
    summary,
    page: pagination.page,
    limit: pagination.limit,
  });
};

export const createMovement = async ({ payload, currentUser }) => {
  const itemId = parsePositiveInt(payload.item_id, 'Insumo');
  const quantity = parsePositiveInt(payload.quantity, 'Cantidad');
  const movementType = normalizeRequiredText(payload.movement_type, 'El tipo de movimiento').toUpperCase();
  let ubicationId = parseOptionalPositiveInt(payload.ubication_id, 'Ubicación');
  let departmentId = parseOptionalPositiveInt(payload.department_id, 'Departamento');
  let receiverName = normalizeOptionalText(payload.receiver_name);
  const reference = normalizeOptionalText(payload.reference);
  const observation = normalizeOptionalText(payload.observation);
  const createdBy = parseOptionalPositiveInt(currentUser?.id, 'Usuario');

  if (!MOVEMENT_TYPES.includes(movementType)) {
    throw new AppError('Tipo de movimiento inválido', 400);
  }

  if (movementType === 'IN' || movementType === 'ADJUSTMENT') {
    const warehouseDepartment = await repository.findWarehouseDepartment();
    if (!warehouseDepartment?.id_ubication) {
      throw new AppError('No existe una ubicación configurada para el departamento Almacén', 409);
    }
    ubicationId = warehouseDepartment.id_ubication;
    departmentId = warehouseDepartment.id;
    if (movementType === 'IN') {
      const sessionUser = await repository.findUserById(currentUser?.id);
      receiverName = normalizeOptionalText(sessionUser?.nombre_completo || sessionUser?.username);
      if (!receiverName) {
        throw new AppError('No se pudo identificar al usuario de la sesión como receptor', 401);
      }
    }
  }

  if (movementType === 'OUT') {
    if (!receiverName) {
      throw new AppError('El receptor es obligatorio para registrar una salida', 400);
    }
  }

  if (movementType === 'OUT' && (!ubicationId || !departmentId)) {
    throw new AppError('La salida requiere ubicación y departamento solicitante', 400);
  }

  const [item, ubication, department] = await Promise.all([
    repository.findItemById(itemId),
    repository.findUbicationById(ubicationId),
    departmentId ? repository.findDepartmentById(departmentId) : null,
  ]);

  if (!item || !item.active) throw new AppError('El insumo no existe o está inactivo', 400);
  if (!ubication) throw new AppError('La ubicación no existe', 400);
  if (departmentId && !department) throw new AppError('El departamento no existe', 400);
  if (movementType === 'OUT' && !departmentId) {
    throw new AppError('La salida requiere departamento solicitante', 400);
  }
  if (movementType === 'ADJUSTMENT' && !reference) {
    throw new AppError('El ajuste requiere una referencia o motivo', 400);
  }

  const movement = await repository.createMovementWithStock({
    itemId,
    ubicationId,
    movementType,
    quantity,
    departmentId,
    receiverName,
    reference,
    observation,
    createdBy,
  });

  return dto.mapMovement(movement);
};

export const createBatchOut = async ({ payload, currentUser }) => {
  const ubicationId = parsePositiveInt(payload.ubication_id, 'Ubicación');
  const departmentId = parsePositiveInt(payload.department_id, 'Departamento');
  const receiverName = normalizeRequiredText(payload.receiver_name, 'El receptor');
  const lines = Array.isArray(payload.items) ? payload.items : [];
  if (!lines.length) throw new AppError('Debe agregar al menos un insumo', 400);
  const items = lines.map((line) => ({
    itemId: parsePositiveInt(line.item_id, 'Insumo'),
    quantity: parsePositiveInt(line.quantity, 'Cantidad'),
  }));
  const uniqueIds = new Set(items.map((line) => line.itemId));
  if (uniqueIds.size !== items.length) throw new AppError('No repita el mismo insumo en el despacho', 400);
  const catalogItems = await Promise.all(items.map((line) => repository.findItemById(line.itemId)));
  if (catalogItems.some((item) => !item || !item.active)) throw new AppError('Uno de los insumos no existe o está inactivo', 400);
  const ubication = await repository.findUbicationById(ubicationId);
  const department = await repository.findDepartmentById(departmentId);
  if (!ubication || !department) throw new AppError('Ubicación o departamento inválido', 400);
  return (await repository.createBatchOutWithStock({ items, ubicationId, departmentId, receiverName, createdBy: parseOptionalPositiveInt(currentUser?.id, 'Usuario') })).map(dto.mapMovement);
};

export const createBatchIn = async ({ payload, currentUser }) => {
  const lines = Array.isArray(payload.items) ? payload.items : [];
  if (!lines.length) throw new AppError('Debe agregar al menos un insumo', 400);
  const items = lines.map((line) => ({
    itemId: parsePositiveInt(line.item_id, 'Insumo'),
    quantity: parsePositiveInt(line.quantity, 'Cantidad'),
  }));
  const uniqueIds = new Set(items.map((line) => line.itemId));
  if (uniqueIds.size !== items.length) throw new AppError('No repita el mismo insumo en la entrada', 400);
  const warehouseDepartment = await repository.findWarehouseDepartment();
  if (!warehouseDepartment?.id_ubication) {
    throw new AppError('No existe una ubicación configurada para el departamento Almacén', 409);
  }
  const sessionUser = await repository.findUserById(currentUser?.id);
  const receiverName = normalizeRequiredText(sessionUser?.nombre_completo || sessionUser?.username, 'El receptor');
  const catalogItems = await Promise.all(items.map((line) => repository.findItemById(line.itemId)));
  if (catalogItems.some((item) => !item || !item.active)) throw new AppError('Uno de los insumos no existe o está inactivo', 400);
  return (await repository.createBatchInWithStock({
    items,
    ubicationId: warehouseDepartment.id_ubication,
    departmentId: warehouseDepartment.id,
    receiverName,
    createdBy: parseOptionalPositiveInt(currentUser?.id, 'Usuario'),
  })).map(dto.mapMovement);
};

export { MOVEMENT_TYPES };
