// inventory-history.service.js

import {
  formatHistoryDate,
  normalizeComparableValue,
  normalizeText,
  parseMovementObject,
  parseNullableId,
  parseOptionalDate,
  parseOptionalPositiveInt,
  parsePagination,
  sanitizeMovementValue,
  toTimestamp,
} from './../utils/inventory.parsers.js';

import {
  ALLOWED_HISTORY_ACTIONS,
  HISTORY_FIELD_LABELS,
  IGNORED_DIFF_FIELDS,
} from '../constants/inventory.constants.js';

import * as repository from '../inventory.repository.js';

export const getHistory = async (query) => {
  const { page, limit } = parsePagination(query);
  const search = String(query?.search || '').trim();
  const action =
    String(query?.action || '')
      .trim()
      .toUpperCase() || null;
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
      newValues,
    };
  });

  const [ubications, departments, statuses, devices, brands, models] = await Promise.all([
    repository.findUbicationsByIds([...ubicationIds]),
    repository.findDepartmentsByIds([...departmentIds]),
    repository.findStatusesByIds([...statusIds]),
    repository.findDevicesByIds([...deviceIds]),
    repository.findBrandsByIds([...brandIds]),
    repository.findModelsByIds([...modelIds]),
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
      modelsMap,
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
        model: row.models?.name || null,
      },
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
          item.changed_fields
            ?.map((change) => `${change.field} ${change.from || ''} ${change.to || ''}`)
            .join(' '),
          item.current_active?.ubication,
          item.current_active?.department,
          item.current_active?.status,
          item.current_active?.device,
          item.current_active?.brand,
          item.current_active?.model,
          item.inventory_id,
          item.id,
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
    totalPages,
  };
};

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
      to: formatChangedValue(key, newObj[key], maps),
    });
  });

  return result;
}

function buildSearchText(parts) {
  return normalizeText(parts.filter(Boolean).join(' '));
}

function resolveHistoryIds(oldValues, newValues) {
  return {
    oldUbicationId: parseNullableId(oldValues.id_ubication),
    newUbicationId: parseNullableId(newValues.id_ubication),
    oldDepartmentId: parseNullableId(oldValues.id_department),
    newDepartmentId: parseNullableId(newValues.id_department),
    oldStatusId: parseNullableId(oldValues.id_status),
    newStatusId: parseNullableId(newValues.id_status),
    oldDeviceId: parseNullableId(oldValues.id_device),
    newDeviceId: parseNullableId(newValues.id_device),
    oldBrandId: parseNullableId(oldValues.id_brand),
    newBrandId: parseNullableId(newValues.id_brand),
    oldModelId: parseNullableId(oldValues.id_model),
    newModelId: parseNullableId(newValues.id_model),
  };
}

function resolveHistoryNames(ids, maps) {
  const {
    oldUbicationId,
    newUbicationId,
    oldDepartmentId,
    newDepartmentId,
    oldStatusId,
    newStatusId,
    oldDeviceId,
    newDeviceId,
    oldBrandId,
    newBrandId,
    oldModelId,
    newModelId,
  } = ids;

  return {
    previousUbication: oldUbicationId ? maps.ubicationsMap.get(oldUbicationId) || null : null,
    newUbication: newUbicationId ? maps.ubicationsMap.get(newUbicationId) || null : null,
    previousDepartment: oldDepartmentId ? maps.departmentsMap.get(oldDepartmentId) || null : null,
    newDepartment: newDepartmentId ? maps.departmentsMap.get(newDepartmentId) || null : null,
    previousStatus: oldStatusId ? maps.statusMap.get(oldStatusId) || null : null,
    newStatus: newStatusId ? maps.statusMap.get(newStatusId) || null : null,
    previousDevice: oldDeviceId ? maps.devicesMap.get(oldDeviceId) || null : null,
    newDevice: newDeviceId ? maps.devicesMap.get(newDeviceId) || null : null,
    previousBrand: oldBrandId ? maps.brandsMap.get(oldBrandId) || null : null,
    newBrand: newBrandId ? maps.brandsMap.get(newBrandId) || null : null,
    previousModel: oldModelId ? maps.modelsMap.get(oldModelId) || null : null,
    newModel: newModelId ? maps.modelsMap.get(newModelId) || null : null,
  };
}

function resolveMovedBy(
  log,
  shouldUseTransferRequester,
  transferRequesterId,
  transferRequesterName
) {
  if (shouldUseTransferRequester) {
    return {
      id: transferRequesterId,
      name: transferRequesterName,
    };
  }

  if (log.user) {
    return {
      id: log.user.id,
      name: log.user.nombre_completo,
    };
  }

  return null;
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
  modelsMap,
}) {
  const ids = resolveHistoryIds(oldValues, newValues);
  const names = resolveHistoryNames(ids, {
    ubicationsMap,
    departmentsMap,
    statusMap,
    devicesMap,
    brandsMap,
    modelsMap,
  });

  const previousUser = sanitizeMovementValue(oldValues.user) || null;
  const newUser = sanitizeMovementValue(newValues.user) || null;

  const tag = sanitizeMovementValue(newValues.tag) || sanitizeMovementValue(oldValues.tag) || null;
  const serie =
    sanitizeMovementValue(newValues.serie) || sanitizeMovementValue(oldValues.serie) || null;
  const transferSnapshot = parseMovementObject(newValues.transfer_snapshot);
  const transferRequesterName = sanitizeMovementValue(newValues.transfer_requester_name) || null;
  const transferRequesterId = parseNullableId(newValues.transfer_requester_id);
  const shouldUseTransferRequester =
    log.source === 'inventory_transfer_requests.approve' && Boolean(transferRequesterName);

  const changedDetails = buildChangedDetails(oldValues, newValues, {
    ubicationsMap,
    departmentsMap,
    statusMap,
    devicesMap,
    brandsMap,
    modelsMap,
  });

  return {
    id: log.id,
    inventory_id: log.entity_id,
    action: log.action,
    moved_at: log.created_at,
    moved_by: resolveMovedBy(
      log,
      shouldUseTransferRequester,
      transferRequesterId,
      transferRequesterName
    ),
    tag,
    serie,
    previous_user: previousUser,
    new_user: newUser,
    previous_ubication: names.previousUbication,
    new_ubication: names.newUbication,
    previous_department: names.previousDepartment,
    new_department: names.newDepartment,
    previous_status: names.previousStatus,
    new_status: names.newStatus,
    previous_device: names.previousDevice,
    new_device: names.newDevice,
    previous_brand: names.previousBrand,
    new_brand: names.newBrand,
    previous_model: names.previousModel,
    new_model: names.newModel,
    device_name: names.newDevice || names.previousDevice,
    brand_name: names.newBrand || names.previousBrand,
    model_name: names.newModel || names.previousModel,
    previous_ip: sanitizeMovementValue(oldValues.ip),
    new_ip: sanitizeMovementValue(newValues.ip),
    previous_observation: sanitizeMovementValue(oldValues.observation),
    new_observation: sanitizeMovementValue(newValues.observation),
    changed_fields: changedDetails,
    transfer_request_id: parseNullableId(newValues.transfer_request_id),
    transfer_snapshot: Object.keys(transferSnapshot).length > 0 ? transferSnapshot : null,
    time_in_previous_location_ms: null,
    current_active: null,
  };
}
