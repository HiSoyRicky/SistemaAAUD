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
import AppError from '../../../common/utils/AppError.js';

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
  const conditionIds = new Set();
  const administrativeAreaIds = new Set();
  const classificationRuleIds = new Set();

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
    const oldConditionId = parseNullableId(oldValues.id_condition);
    const newConditionId = parseNullableId(newValues.id_condition);
    const oldAdministrativeAreaId = parseNullableId(oldValues.id_administrative_area);
    const newAdministrativeAreaId = parseNullableId(newValues.id_administrative_area);
    const oldClassificationRuleId = parseNullableId(oldValues.asset_classification_rule_id);
    const newClassificationRuleId = parseNullableId(newValues.asset_classification_rule_id);

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
    if (oldConditionId) conditionIds.add(oldConditionId);
    if (newConditionId) conditionIds.add(newConditionId);
    if (oldAdministrativeAreaId) administrativeAreaIds.add(oldAdministrativeAreaId);
    if (newAdministrativeAreaId) administrativeAreaIds.add(newAdministrativeAreaId);
    if (oldClassificationRuleId) classificationRuleIds.add(oldClassificationRuleId);
    if (newClassificationRuleId) classificationRuleIds.add(newClassificationRuleId);

    return {
      log,
      oldValues,
      newValues,
    };
  });

  const [
    ubications,
    departments,
    statuses,
    devices,
    brands,
    models,
    conditions,
    administrativeAreas,
    classificationRules,
  ] = await Promise.all([
    repository.findUbicationsByIds([...ubicationIds]),
    repository.findDepartmentsByIds([...departmentIds]),
    repository.findStatusesByIds([...statusIds]),
    repository.findDevicesByIds([...deviceIds]),
    repository.findBrandsByIds([...brandIds]),
    repository.findModelsByIds([...modelIds]),
    repository.findConditionsByIds([...conditionIds]),
    repository.findAdministrativeAreasByIds([...administrativeAreaIds]),
    repository.findAssetClassificationRulesByIds([...classificationRuleIds]),
  ]);

  const ubicationsMap = new Map(ubications.map((item) => [item.id, item.name]));
  const departmentsMap = new Map(departments.map((item) => [item.id, item.name]));
  const statusMap = new Map(statuses.map((item) => [item.id, item.name]));
  const devicesMap = new Map(devices.map((item) => [item.id, item.name]));
  const brandsMap = new Map(brands.map((item) => [item.id, item.name]));
  const modelsMap = new Map(models.map((item) => [item.id, item.name]));
  const conditionsMap = new Map(conditions.map((item) => [item.id, item.name]));
  const administrativeAreasMap = new Map(
    administrativeAreas.map((item) => [item.id, item.name])
  );
  const classificationRulesMap = new Map(classificationRules.map((item) => [item.id, item]));

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
      conditionsMap,
      administrativeAreasMap,
      classificationRulesMap,
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
        administrative_area: row.administrative_area?.name || null,
        status: row.status?.name || null,
        classification: row.asset_classification_rule?.classification?.code_new || null,
        asset_type: row.asset_classification_rule?.asset_type?.code || null,
        extension: row.asset_classification_rule?.extension?.code || null,
                technology: row.inventory_devices
                  ? {
                      device: row.inventory_devices.device?.name || null,
                      brand: row.inventory_devices.brand?.name || null,
                      model: row.inventory_devices.model?.name || null,
                      ip: row.inventory_devices.ip || null,
                    }
                  : null,
        device: row.inventory_devices?.device?.name || row.devices?.name || null,
        brand: row.inventory_devices?.brand?.name || row.brands?.name || null,
        model: row.inventory_devices?.model?.name || row.models?.name || null,
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
    case 'id_condition': {
      const id = parseNullableId(value);
      return id ? maps.conditionsMap.get(id) || String(id) : null;
    }
    case 'id_administrative_area': {
      const id = parseNullableId(value);
      return id ? maps.administrativeAreasMap.get(id) || String(id) : null;
    }
    case 'asset_classification_rule_id': {
      const id = parseNullableId(value);
      const rule = id ? maps.classificationRulesMap.get(id) : null;
      return rule
        ? [
            rule.classification?.code_new,
            rule.classification?.description,
            rule.asset_type?.code,
            rule.extension?.code,
          ]
            .filter(Boolean)
            .join(' · ')
        : id
          ? String(id)
          : null;
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
    oldConditionId: parseNullableId(oldValues.id_condition),
    newConditionId: parseNullableId(newValues.id_condition),
    oldAdministrativeAreaId: parseNullableId(oldValues.id_administrative_area),
    newAdministrativeAreaId: parseNullableId(newValues.id_administrative_area),
    oldClassificationRuleId: parseNullableId(oldValues.asset_classification_rule_id),
    newClassificationRuleId: parseNullableId(newValues.asset_classification_rule_id),
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
    oldConditionId,
    newConditionId,
    oldAdministrativeAreaId,
    newAdministrativeAreaId,
    oldClassificationRuleId,
    newClassificationRuleId,
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
    previousCondition: oldConditionId ? maps.conditionsMap.get(oldConditionId) || null : null,
    newCondition: newConditionId ? maps.conditionsMap.get(newConditionId) || null : null,
    previousAdministrativeArea: oldAdministrativeAreaId
      ? maps.administrativeAreasMap.get(oldAdministrativeAreaId) || null
      : null,
    newAdministrativeArea: newAdministrativeAreaId
      ? maps.administrativeAreasMap.get(newAdministrativeAreaId) || null
      : null,
    previousClassificationRule: oldClassificationRuleId
      ? maps.classificationRulesMap.get(oldClassificationRuleId) || null
      : null,
    newClassificationRule: newClassificationRuleId
      ? maps.classificationRulesMap.get(newClassificationRuleId) || null
      : null,
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

export function buildHistoryItem({
  log,
  oldValues,
  newValues,
  ubicationsMap,
  departmentsMap,
  statusMap,
  devicesMap,
  brandsMap,
  modelsMap,
  conditionsMap,
  administrativeAreasMap,
  classificationRulesMap,
}) {
  const ids = resolveHistoryIds(oldValues, newValues);
  const names = resolveHistoryNames(ids, {
    ubicationsMap,
    departmentsMap,
    statusMap,
    devicesMap,
    brandsMap,
    modelsMap,
    conditionsMap,
    administrativeAreasMap,
    classificationRulesMap,
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
    conditionsMap,
    administrativeAreasMap,
    classificationRulesMap,
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
    previous_administrative_area: names.previousAdministrativeArea,
    new_administrative_area: names.newAdministrativeArea,
      previous_classification_rule: names.previousClassificationRule,
      new_classification_rule: names.newClassificationRule,
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
