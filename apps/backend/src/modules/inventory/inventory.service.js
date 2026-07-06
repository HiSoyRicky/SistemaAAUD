import AppError from '../../common/utils/AppError.js';
import * as repository from './inventory.repository.js';
import {
  mapInventoryResponse,
  mapCreateInventoryResponse,
  mapUpdateInventoryResponse
} from './inventory.dto.js';
import {
  getResolvedUserPermissionCodes,
  hasPermissionCode
} from '../../common/rbac/permissions.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const ALLOWED_HISTORY_ACTIONS = new Set(['CREATE', 'UPDATE', 'DELETE']);
const IGNORED_DIFF_FIELDS = new Set([
  'id',
  'updated_at',
  'updated_by',
  'created_at',
  'created_by',
  'transfer_snapshot',
  'transfer_request_id',
  'transfer_requester_id',
  'transfer_requester_name',
  'ubications',
  'departments',
  'status',
  'devices',
  'brands',
  'models'
]);
const HISTORY_FIELD_LABELS = {
  tag: 'Marbete',
  serie: 'Serie',
  user: 'Usuario',
  id_ubication: 'Ubicación',
  id_department: 'Departamento',
  id_status: 'Estado',
  id_device: 'Equipo',
  id_brand: 'Marca',
  id_model: 'Modelo',
  ip: 'IP',
  observation: 'Observación',
  transferdate: 'Fecha de traslado'
};
const INVENTORY_FIELD_PERMISSIONS = {
  id_ubication: 'inventory.update_location',
  id_department: 'inventory.update_department',
  user: 'inventory.update_assignee'
};
const INVENTORY_FIELD_LABELS = {
  id_ubication: 'Ubicación',
  id_department: 'Departamento',
  user: 'Usuario asignado'
};
const INVENTORY_UPDATE_FIELDS = new Set([
  'tag',
  'id_ubication',
  'id_department',
  'user',
  'id_device',
  'id_brand',
  'id_model',
  'serie',
  'ip',
  'id_status',
  'transferdate',
  'observation'
]);

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function isDiscardedStatus(statusName) {
  return normalizeText(statusName) === 'DESCARTADO';
}

function parseIntSafe(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

async function assertInventoryUpdatePermissions(payload, currentUser) {
  const grantedCodes = await getResolvedUserPermissionCodes(currentUser);
  const hasFullUpdate = hasPermissionCode({
    grantedCodes,
    requiredCode: 'inventory.update'
  });

  if (hasFullUpdate) {
    return;
  }

  const requestedFields = Object.keys(payload || {}).filter(
    (field) => INVENTORY_UPDATE_FIELDS.has(field) && payload[field] !== undefined
  );

  const unauthorizedFields = requestedFields.filter((field) => {
    const requiredPermission = INVENTORY_FIELD_PERMISSIONS[field];

    return (
      !requiredPermission ||
      !hasPermissionCode({
        grantedCodes,
        requiredCode: requiredPermission
      })
    );
  });

  if (unauthorizedFields.length) {
    const labels = unauthorizedFields.map(
      (field) => INVENTORY_FIELD_LABELS[field] || field
    );

    throw new AppError(
      `No tienes permiso para modificar: ${labels.join(', ')}`,
      403,
      'INVENTORY_FIELDS_NOT_ALLOWED'
    );
  }
}

function parseOptionalPositiveInt(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NaN;
  }

  return parsed;
}

function parseRequiredPositiveInt(value) {
  const parsed = parseOptionalPositiveInt(value);
  return parsed === null ? NaN : parsed;
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
      value.name ||
      value.label ||
      value.title ||
      value.nombre_completo ||
      value.username ||
      null
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
    timeZone: 'America/Panama',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatChangedValue(key, value, maps) {
  switch (key) {
    case 'id_ubication': {
      const id = parseNullableId(value);
      return id ? maps.ubicationsMap.get(id) || String(id) : null;
    }
    case 'id_department': {
      const id = parseNullableId(value);
      return id ? maps.departmentsMap.get(id) || String(id) : null;
    }
    case 'id_status': {
      const id = parseNullableId(value);
      return id ? maps.statusMap.get(id) || String(id) : null;
    }
    case 'id_device': {
      const id = parseNullableId(value);
      return id ? maps.devicesMap.get(id) || String(id) : null;
    }
    case 'id_brand': {
      const id = parseNullableId(value);
      return id ? maps.brandsMap.get(id) || String(id) : null;
    }
    case 'id_model': {
      const id = parseNullableId(value);
      return id ? maps.modelsMap.get(id) || String(id) : null;
    }
    case 'transferdate':
      return formatHistoryDate(value);
    default:
      return sanitizeMovementValue(value);
  }
}

function buildChangedDetails(oldValues, newValues, maps) {
  const oldObj = parseMovementObject(oldValues);
  const newObj = parseMovementObject(newValues);

  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const result = [];

  keys.forEach((key) => {
    if (IGNORED_DIFF_FIELDS.has(key)) return;

    const oldComparable = normalizeComparableValue(oldObj[key]);
    const newComparable = normalizeComparableValue(newObj[key]);

    if (oldComparable === newComparable) return;

    result.push({
      field: HISTORY_FIELD_LABELS[key] || key,
      from: formatChangedValue(key, oldObj[key], maps),
      to: formatChangedValue(key, newObj[key], maps)
    });
  });

  return result;
}

function buildSearchText(parts) {
  return normalizeText(parts.filter(Boolean).join(' '));
}

function toTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function buildHistoryItem({
  log,
  oldValues,
  newValues,
  ubicationsMap,
  departmentsMap,
  statusMap,
  devicesMap,
  brandsMap,
  modelsMap
}) {
  const oldUbicationId = parseNullableId(oldValues.id_ubication);
  const newUbicationId = parseNullableId(newValues.id_ubication);
  const oldDepartmentId = parseNullableId(oldValues.id_department);
  const newDepartmentId = parseNullableId(newValues.id_department);
  const oldStatusId = parseNullableId(oldValues.id_status);
  const newStatusId = parseNullableId(newValues.id_status);
  const oldDeviceId = parseNullableId(oldValues.id_device);
  const newDeviceId = parseNullableId(newValues.id_device);
  const oldBrandId = parseNullableId(oldValues.id_brand);
  const newBrandId = parseNullableId(newValues.id_brand);
  const oldModelId = parseNullableId(oldValues.id_model);
  const newModelId = parseNullableId(newValues.id_model);

  const previousUser = sanitizeMovementValue(oldValues.user);
  const newUser = sanitizeMovementValue(newValues.user);

  const previousUbication = oldUbicationId ? ubicationsMap.get(oldUbicationId) || null : null;
  const newUbication = newUbicationId ? ubicationsMap.get(newUbicationId) || null : null;

  const previousDepartment = oldDepartmentId ? departmentsMap.get(oldDepartmentId) || null : null;
  const newDepartment = newDepartmentId ? departmentsMap.get(newDepartmentId) || null : null;

  const previousStatus = oldStatusId ? statusMap.get(oldStatusId) || null : null;
  const newStatus = newStatusId ? statusMap.get(newStatusId) || null : null;
  const previousDevice = oldDeviceId ? devicesMap.get(oldDeviceId) || null : null;
  const newDevice = newDeviceId ? devicesMap.get(newDeviceId) || null : null;
  const previousBrand = oldBrandId ? brandsMap.get(oldBrandId) || null : null;
  const newBrand = newBrandId ? brandsMap.get(newBrandId) || null : null;
  const previousModel = oldModelId ? modelsMap.get(oldModelId) || null : null;
  const newModel = newModelId ? modelsMap.get(newModelId) || null : null;

  const tag = sanitizeMovementValue(newValues.tag) || sanitizeMovementValue(oldValues.tag) || null;
  const serie = sanitizeMovementValue(newValues.serie) || sanitizeMovementValue(oldValues.serie) || null;
  const transferSnapshot = parseMovementObject(newValues.transfer_snapshot);
  const transferRequesterName =
    sanitizeMovementValue(newValues.transfer_requester_name) || null;
  const transferRequesterId = parseNullableId(newValues.transfer_requester_id);
  const shouldUseTransferRequester =
    log.source === 'inventory_transfer_requests.approve' &&
    Boolean(transferRequesterName);
  const changedDetails = buildChangedDetails(oldValues, newValues, {
    ubicationsMap,
    departmentsMap,
    statusMap,
    devicesMap,
    brandsMap,
    modelsMap
  });

  return {
    id: log.id,
    inventory_id: log.entity_id,
    action: log.action,
    moved_at: log.created_at,
    moved_by: shouldUseTransferRequester
      ? {
          id: transferRequesterId,
          name: transferRequesterName
        }
      : log.user
        ? {
            id: log.user.id,
            name: log.user.nombre_completo
          }
        : null,
    tag,
    serie,
    previous_user: previousUser,
    new_user: newUser,
    previous_ubication: previousUbication,
    new_ubication: newUbication,
    previous_department: previousDepartment,
    new_department: newDepartment,
    previous_status: previousStatus,
    new_status: newStatus,
    previous_device: previousDevice,
    new_device: newDevice,
    previous_brand: previousBrand,
    new_brand: newBrand,
    previous_model: previousModel,
    new_model: newModel,
    device_name: newDevice || previousDevice,
    brand_name: newBrand || previousBrand,
    model_name: newModel || previousModel,
    previous_ip: sanitizeMovementValue(oldValues.ip),
    new_ip: sanitizeMovementValue(newValues.ip),
    previous_observation: sanitizeMovementValue(oldValues.observation),
    new_observation: sanitizeMovementValue(newValues.observation),
    changed_fields: changedDetails,
    transfer_request_id: parseNullableId(newValues.transfer_request_id),
    transfer_snapshot:
      Object.keys(transferSnapshot).length > 0 ? transferSnapshot : null,
    time_in_previous_location_ms: null,
    current_active: null
  };
}

export const getAll = async (query) => {
  const rawSearch = typeof query?.search === 'string' ? query.search.trim() : '';
  const search = rawSearch || undefined;
  const inventory = await repository.findAll(search);
  return mapInventoryResponse(inventory);
};

export const getHistory = async (query) => {
  const { page, limit } = parsePagination(query);
  const search = String(query?.search || '').trim();
  const action = String(query?.action || '').trim().toUpperCase() || null;
  const inventoryId = parseOptionalPositiveInt(query?.inventoryId);

  if (action && !ALLOWED_HISTORY_ACTIONS.has(action)) {
    throw new AppError('Acción inválida', 400);
  }
  if (Number.isNaN(inventoryId)) {
    throw new AppError('ID de inventario inválido', 400);
  }

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

  const logs = await repository.findInventoryMovementLogs({ action, from, to, inventoryId });

  const ubicationIds = new Set();
  const departmentIds = new Set();
  const statusIds = new Set();
  const deviceIds = new Set();
  const brandIds = new Set();
  const modelIds = new Set();

  const rawMovements = logs.map((log) => {
    const oldValues = parseMovementObject(log.old_values);
    const newValues = parseMovementObject(log.new_values);

    const oldUbicationId = parseNullableId(oldValues.id_ubication);
    const newUbicationId = parseNullableId(newValues.id_ubication);
    const oldDepartmentId = parseNullableId(oldValues.id_department);
    const newDepartmentId = parseNullableId(newValues.id_department);
    const oldStatusId = parseNullableId(oldValues.id_status);
    const newStatusId = parseNullableId(newValues.id_status);
    const oldDeviceId = parseNullableId(oldValues.id_device);
    const newDeviceId = parseNullableId(newValues.id_device);
    const oldBrandId = parseNullableId(oldValues.id_brand);
    const newBrandId = parseNullableId(newValues.id_brand);
    const oldModelId = parseNullableId(oldValues.id_model);
    const newModelId = parseNullableId(newValues.id_model);

    if (oldUbicationId) ubicationIds.add(oldUbicationId);
    if (newUbicationId) ubicationIds.add(newUbicationId);

    if (oldDepartmentId) departmentIds.add(oldDepartmentId);
    if (newDepartmentId) departmentIds.add(newDepartmentId);

    if (oldStatusId) statusIds.add(oldStatusId);
    if (newStatusId) statusIds.add(newStatusId);
    if (oldDeviceId) deviceIds.add(oldDeviceId);
    if (newDeviceId) deviceIds.add(newDeviceId);
    if (oldBrandId) brandIds.add(oldBrandId);
    if (newBrandId) brandIds.add(newBrandId);
    if (oldModelId) modelIds.add(oldModelId);
    if (newModelId) modelIds.add(newModelId);

    return {
      log,
      oldValues,
      newValues
    };
  });

  const [ubications, departments, statuses, devices, brands, models] = await Promise.all([
    repository.findUbicationsByIds([...ubicationIds]),
    repository.findDepartmentsByIds([...departmentIds]),
    repository.findStatusesByIds([...statusIds]),
    repository.findDevicesByIds([...deviceIds]),
    repository.findBrandsByIds([...brandIds]),
    repository.findModelsByIds([...modelIds])
  ]);

  const ubicationsMap = new Map(ubications.map((item) => [item.id, item.name]));
  const departmentsMap = new Map(departments.map((item) => [item.id, item.name]));
  const statusMap = new Map(statuses.map((item) => [item.id, item.name]));
  const devicesMap = new Map(devices.map((item) => [item.id, item.name]));
  const brandsMap = new Map(brands.map((item) => [item.id, item.name]));
  const modelsMap = new Map(models.map((item) => [item.id, item.name]));

  const mapped = rawMovements.map(({ log, oldValues, newValues }) =>
    buildHistoryItem({
      log,
      oldValues,
      newValues,
      ubicationsMap,
      departmentsMap,
      statusMap,
      devicesMap,
      brandsMap,
      modelsMap
    })
  );

  const groupedByInventory = new Map();

  for (const item of mapped) {
    const key = item.inventory_id;
    if (!groupedByInventory.has(key)) {
      groupedByInventory.set(key, []);
    }
    groupedByInventory.get(key).push(item);
  }

  groupedByInventory.forEach((group) => {
    group.sort((a, b) => (toTimestamp(b.moved_at) || 0) - (toTimestamp(a.moved_at) || 0));

    for (let index = 0; index < group.length; index += 1) {
      const current = group[index];
      const older = group[index + 1];

      if (!older) {
        current.time_in_previous_location_ms = null;
        continue;
      }

      const currentTs = toTimestamp(current.moved_at);
      const olderTs = toTimestamp(older.moved_at);

      if (currentTs === null || olderTs === null) {
        current.time_in_previous_location_ms = null;
        continue;
      }

      const delta = currentTs - olderTs;
      current.time_in_previous_location_ms = delta > 0 ? delta : null;
    }
  });

  const inventoryIds = [...new Set(mapped.map((item) => item.inventory_id).filter(Boolean))];
  const currentInventory = await repository.findCurrentInventoryByIds(inventoryIds);
  const currentByInventoryId = new Map(
    currentInventory.map((row) => [
      row.id,
      {
        ubication: row.ubications?.name || null,
        department: row.departments?.name || null,
        status: row.status?.name || null,
        device: row.devices?.name || null,
        brand: row.brands?.name || null,
        model: row.models?.name || null
      }
    ])
  );

  for (const item of mapped) {
    item.current_active = currentByInventoryId.get(item.inventory_id) || null;
  }

  const normalizedSearch = normalizeText(search);

  const filtered = normalizedSearch
    ? mapped.filter((item) => {
        const searchableText = buildSearchText([
          item.tag,
          item.serie,
          item.action,
          item.moved_by?.name,
          item.previous_user,
          item.new_user,
          item.previous_ubication,
          item.new_ubication,
          item.previous_department,
          item.new_department,
          item.previous_status,
          item.new_status,
          item.previous_device,
          item.new_device,
          item.previous_brand,
          item.new_brand,
          item.previous_model,
          item.new_model,
          item.device_name,
          item.brand_name,
          item.model_name,
          item.previous_ip,
          item.new_ip,
          item.previous_observation,
          item.new_observation,
          item.changed_fields?.map((change) => `${change.field} ${change.from || ''} ${change.to || ''}`).join(' '),
          item.current_active?.ubication,
          item.current_active?.department,
          item.current_active?.status,
          item.current_active?.device,
          item.current_active?.brand,
          item.current_active?.model,
          item.inventory_id,
          item.id
        ]);

        return searchableText.includes(normalizedSearch);
      })
    : mapped;

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    total,
    page: safePage,
    totalPages
  };
};

export const create = async (payload, currentUser) => {
  const userId = currentUser?.id;

  const {
    tag,
    id_ubication,
    id_department,
    user,
    id_device,
    id_brand,
    id_model,
    serie,
    ip,
    id_status,
    transferdate,
    observation
  } = payload;

  if (!tag || !id_device || !id_brand || !id_model || !serie || !id_status) {
    throw new AppError('Faltan campos obligatorios', 400);
  }

  const idUbication = parseOptionalPositiveInt(id_ubication);
  const idDepartment = parseOptionalPositiveInt(id_department);
  const idDevice = parseRequiredPositiveInt(id_device);
  const idBrand = parseRequiredPositiveInt(id_brand);
  const idModel = parseRequiredPositiveInt(id_model);
  const idStatus = parseRequiredPositiveInt(id_status);

  if ([idUbication, idDepartment, idDevice, idBrand, idModel, idStatus].some((value) => Number.isNaN(value))) {
    throw new AppError('Los IDs deben ser números enteros válidos', 400);
  }

  const [deviceExists, brandExists, modelExists, statusExists] = await Promise.all([
    repository.findDeviceById(idDevice),
    repository.findBrandById(idBrand),
    repository.findModelById(idModel),
    repository.findStatusById(idStatus)
  ]);

  if (!deviceExists) throw new AppError('El dispositivo especificado no existe', 400);
  if (!brandExists) throw new AppError('La marca especificada no existe', 400);
  if (!modelExists) throw new AppError('El modelo especificado no existe', 400);
  if (!statusExists) throw new AppError('El estado especificado no existe', 400);

  const shouldDiscardLocation = isDiscardedStatus(statusExists.name);
  const supportsNullLocation = shouldDiscardLocation
    ? await repository.areInventoryLocationFieldsNullable()
    : true;

  if (!shouldDiscardLocation && (idUbication === null || idDepartment === null)) {
    throw new AppError('Ubicación y departamento son obligatorios para este estado', 400);
  }

  let finalUbicationId = idUbication;
  let finalDepartmentId = idDepartment;

  if (shouldDiscardLocation && supportsNullLocation) {
    finalUbicationId = null;
    finalDepartmentId = null;
  } else {
    if (shouldDiscardLocation && !supportsNullLocation && (idUbication === null || idDepartment === null)) {
      throw new AppError(
        'La base de datos aún no permite vaciar ubicación/departamento en DESCARTADO. Solicita aplicar la migración pendiente.',
        400
      );
    }

    const [ubicationExists, departmentExists] = await Promise.all([
      repository.findUbicationById(idUbication),
      repository.findDepartmentById(idDepartment)
    ]);

    if (!ubicationExists) throw new AppError('La ubicación especificada no existe', 400);
    if (!departmentExists) throw new AppError('El departamento especificado no existe', 400);
  }

  let transferDateObj = null;
  if (transferdate) {
    const date = transferdate instanceof Date ? transferdate : new Date(transferdate);
    if (Number.isNaN(date.getTime())) {
      throw new AppError('El campo transferdate debe ser una fecha válida', 400);
    }
    transferDateObj = date;
  }

  try {
    const created = await repository.create({
      tag,
      id_ubication: finalUbicationId,
      id_department: finalDepartmentId,
      user: user || null,
      id_device: idDevice,
      id_brand: idBrand,
      id_model: idModel,
      serie,
      ip: ip || null,
      id_status: idStatus,
      transferdate: transferDateObj,
      observation: observation || null,
      created_by: userId,
      created_at: new Date()
    });

    return mapCreateInventoryResponse(created);
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError('ID de referencia inválido (FK no existe)', 400);
    }
    if (error.code === 'P2002') {
      throw new AppError('Ya existe un dispositivo con ese tag o serie', 409);
    }
    if (error.code === 'P2004') {
      throw new AppError('Error de restricción en la base de datos', 400);
    }
    if (error.code === 'P2011') {
      throw new AppError('Error: campo requerido no puede ser nulo', 400);
    }

    throw new AppError('Error al crear dispositivo', 500);
  }
};

export const update = async (idParam, payload, currentUser) => {
  const id = parseIntSafe(idParam);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const existing = await repository.findById(id);
  if (!existing) {
    throw new AppError('Equipo no encontrado', 404);
  }

  await assertInventoryUpdatePermissions(payload, currentUser);

  const userId = currentUser?.id;

  const {
    tag,
    id_ubication,
    id_department,
    user,
    id_device,
    id_brand,
    id_model,
    serie,
    ip,
    id_status,
    transferdate,
    observation
  } = payload;

  const parsedUbication = parseOptionalPositiveInt(id_ubication);
  const parsedDepartment = parseOptionalPositiveInt(id_department);
  const parsedDevice = parseOptionalPositiveInt(id_device);
  const parsedBrand = parseOptionalPositiveInt(id_brand);
  const parsedModel = parseOptionalPositiveInt(id_model);
  const parsedStatus = parseOptionalPositiveInt(id_status);

  if (id_ubication !== undefined && Number.isNaN(parsedUbication)) {
    throw new AppError('Ubicación inválida', 400);
  }
  if (id_department !== undefined && Number.isNaN(parsedDepartment)) {
    throw new AppError('Departamento inválido', 400);
  }
  if (id_device !== undefined && Number.isNaN(parsedDevice)) {
    throw new AppError('Dispositivo inválido', 400);
  }
  if (id_brand !== undefined && Number.isNaN(parsedBrand)) {
    throw new AppError('Marca inválida', 400);
  }
  if (id_model !== undefined && Number.isNaN(parsedModel)) {
    throw new AppError('Modelo inválido', 400);
  }
  if (id_status !== undefined && Number.isNaN(parsedStatus)) {
    throw new AppError('Estado inválido', 400);
  }

  const currentStatus = await repository.findStatusById(existing.id_status);
  if (!currentStatus) {
    throw new AppError('El estado actual del equipo no existe', 400);
  }

  let targetStatus = currentStatus;
  if (id_status !== undefined) {
    const status = await repository.findStatusById(parsedStatus);
    if (!status) {
      throw new AppError('El estado proporcionado no existe', 400);
    }
    targetStatus = status;
  }

  const finalIsDiscarded = isDiscardedStatus(targetStatus.name);
  const supportsNullLocation = finalIsDiscarded
    ? await repository.areInventoryLocationFieldsNullable()
    : true;

  if (id_ubication !== undefined && parsedUbication !== null) {
    const ubication = await repository.findUbicationById(parsedUbication);
    if (!ubication) {
      throw new AppError('La ubicación proporcionada no existe', 400);
    }
  }

  if (id_department !== undefined && parsedDepartment !== null) {
    const department = await repository.findDepartmentById(parsedDepartment);
    if (!department) {
      throw new AppError('El departamento proporcionado no existe', 400);
    }
  }

  if (id_device !== undefined) {
    const device = await repository.findDeviceById(parsedDevice);
    if (!device) {
      throw new AppError('El dispositivo proporcionado no existe', 400);
    }
  }

  if (id_brand !== undefined) {
    const brand = await repository.findBrandById(parsedBrand);
    if (!brand) {
      throw new AppError('La marca proporcionada no existe', 400);
    }
  }

  if (id_model !== undefined) {
    const model = await repository.findModelById(parsedModel);
    if (!model) {
      throw new AppError('El modelo proporcionado no existe', 400);
    }
  }

  const effectiveUbication = id_ubication !== undefined ? parsedUbication : existing.id_ubication;
  const effectiveDepartment = id_department !== undefined ? parsedDepartment : existing.id_department;

  if (!finalIsDiscarded) {
    if (!effectiveUbication || !effectiveDepartment) {
      throw new AppError('Ubicación y departamento son obligatorios para este estado', 400);
    }

    const [ubicationExists, departmentExists] = await Promise.all([
      repository.findUbicationById(effectiveUbication),
      repository.findDepartmentById(effectiveDepartment)
    ]);

    if (!ubicationExists) {
      throw new AppError('La ubicación proporcionada no existe', 400);
    }

    if (!departmentExists) {
      throw new AppError('El departamento proporcionado no existe', 400);
    }
  }

  const updateData = { updated_by: userId };

  if (tag !== undefined) updateData.tag = tag;

  if (finalIsDiscarded) {
    if (supportsNullLocation) {
      updateData.id_ubication = null;
      updateData.id_department = null;
    } else {
      // Compatibilidad temporal cuando la BD sigue en NOT NULL.
      // Se conserva internamente el valor hasta que se aplique la migración.
      updateData.id_ubication = existing.id_ubication;
      updateData.id_department = existing.id_department;
    }
  } else {
    if (id_ubication !== undefined) updateData.id_ubication = parsedUbication;
    if (id_department !== undefined) updateData.id_department = parsedDepartment;
  }

  if (id_device !== undefined) updateData.id_device = parsedDevice;
  if (id_brand !== undefined) updateData.id_brand = parsedBrand;
  if (id_model !== undefined) updateData.id_model = parsedModel;
  if (serie !== undefined) updateData.serie = serie;
  if (id_status !== undefined) updateData.id_status = parsedStatus;
  if (user !== undefined) updateData.user = user;
  if (ip !== undefined) updateData.ip = ip;
  if (observation !== undefined) updateData.observation = observation;
  if (transferdate !== undefined) {
    updateData.transferdate = transferdate ? new Date(transferdate) : null;
  }

  if (Object.keys(updateData).length === 1) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  try {
    const updated = await repository.updateById(id, updateData);
    return mapUpdateInventoryResponse(updated);
  } catch (error) {
    if (error.code === 'P2003') {
      throw new AppError('ID de referencia inválido (FK no existe)', 400);
    }
    if (error.code === 'P2002') {
      throw new AppError('Ya existe un dispositivo con ese tag o serie', 409);
    }
    if (error.code === 'P2004') {
      throw new AppError('Error de restricción en la base de datos', 400);
    }
    if (error.code === 'P2011') {
      throw new AppError(
        'La base de datos no permite valores nulos para ubicación/departamento. Falta aplicar la migración.',
        400
      );
    }

    throw new AppError('Error al actualizar dispositivo', 500);
  }
};
