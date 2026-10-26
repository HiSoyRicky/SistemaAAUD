import AppError from '../../common/utils/AppError.js';
import { prisma } from '../../config/prisma.js';
import * as repository from './classification-rules.repository.js';
import { syncInventoryClassification } from './classification-sync.service.js';
import { resolveClassificationRule } from './services/inventory-classification.service.js';

const DEVICE_RULE_CONFLICT_MESSAGE =
  'Este bien ya tiene una regla de clasificación; edítela en lugar de crear otra';
const EXPECTED_EXTENSION_BY_TYPE = {
  TECHNOLOGY: 'DEVICES',
  VEHICLE: 'VEHICLES',
  PROPERTY: 'PROPERTIES',
};
const VEHICLE_CLASSIFICATION_CODE = '12040302';
const TECHNOLOGY_EXCLUDED_CODES = new Set(['12040302', '12040322']);
const PROPERTY_EXCLUDED_CODES = new Set(['12040302', '12040320', '12040323', '12040324']);

function isClassificationCompatible(typeCode, classificationCode) {
  const code = String(classificationCode || '');
  if (typeCode === 'VEHICLE') return code === VEHICLE_CLASSIFICATION_CODE;
  if (typeCode === 'TECHNOLOGY')
    return code.startsWith('120403') && !TECHNOLOGY_EXCLUDED_CODES.has(code);
  if (typeCode === 'PROPERTY') {
    return (
      (code.startsWith('1204') && !PROPERTY_EXCLUDED_CODES.has(code)) || code.startsWith('1205')
    );
  }
  return false;
}

async function assertDeviceRuleAvailable(deviceId, ruleId = null) {
  if (deviceId === null) return;
  const other = await repository.findOtherByDevice(deviceId, ruleId);
  if (other) throw new AppError(DEVICE_RULE_CONFLICT_MESSAGE, 409);
}

async function assertGenericRuleAvailable(data, ruleId = null, db = prisma) {
  if (data.device_id !== null) return;
  const existing = await repository.findOtherGenericExactRule(
    {
      classificationId: data.classification_id,
      assetTypeId: data.asset_type_id,
      extensionId: data.extension_id,
      administrativeAreaId: data.administrative_area_id,
    },
    ruleId,
    db
  );
  if (existing) {
    throw new AppError(
      'Ya existe una regla genérica para esta clasificación y alcance.',
      409,
      'DUPLICATE_GENERIC_RULE'
    );
  }
}

function parseId(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError(`${field} inválido`, 400);
  return parsed;
}

function normalizePayload(payload, { partial = false } = {}) {
  const normalized = {};
  for (const [key, field] of [
    ['device_id', 'device_id'],
    ['classification_id', 'classification_id'],
    ['asset_type_id', 'asset_type_id'],
    ['extension_id', 'extension_id'],
    ['administrative_area_id', 'administrative_area_id'],
  ]) {
    if (!partial || Object.prototype.hasOwnProperty.call(payload, key)) {
      normalized[key] = parseId(payload[key], field);
    }
  }

  if (normalized.administrative_area_id === null) {
    throw new AppError(
      'El área administrativa es obligatoria; las reglas globales no están permitidas.',
      400
    );
  }

  const deviceId = normalized.device_id ?? null;
  const isDefault =
    payload.is_default === undefined ? deviceId === null : Boolean(payload.is_default);
  if (deviceId !== null && isDefault) {
    throw new AppError('Las reglas específicas por device no pueden ser predeterminadas', 400);
  }

  if (!partial || payload.active !== undefined)
    normalized.active = payload.active === undefined ? true : Boolean(payload.active);
  if (!partial || payload.is_default !== undefined || deviceId !== null)
    normalized.is_default = isDefault;
  return normalized;
}

async function validateReferences(data, db = prisma) {
  const refs = await repository.findReferences(
    {
      deviceId: data.device_id ?? null,
      classificationId: data.classification_id,
      assetTypeId: data.asset_type_id,
      extensionId: data.extension_id ?? null,
      areaId: data.administrative_area_id ?? null,
    },
    db
  );

  if (data.device_id !== null && !refs.device)
    throw new AppError('El device especificado no existe', 400);
  if (!refs.classification) throw new AppError('La clasificación patrimonial no existe', 400);
  if (!refs.classification.active || !refs.classification.is_assignable) {
    throw new AppError('La clasificación debe estar activa y ser asignable', 400);
  }
  if (!refs.assetType || !refs.assetType.active)
    throw new AppError('El asset type no existe o está inactivo', 400);
  if (data.extension_id !== null && (!refs.extension || !refs.extension.active)) {
    throw new AppError('La extension no existe o está inactiva', 400);
  }
  const expectedExtension = EXPECTED_EXTENSION_BY_TYPE[refs.assetType.code];
  if (expectedExtension && refs.extension?.code !== expectedExtension) {
    throw new AppError(
      `El tipo ${refs.assetType.name} requiere la extensión ${expectedExtension}.`,
      400
    );
  }
  if (!isClassificationCompatible(refs.assetType.code, refs.classification.code_new)) {
    throw new AppError('La clasificación seleccionada no corresponde al tipo de activo.', 400);
  }
  if (!refs.area) {
    throw new AppError('El área administrativa no existe', 400);
  }
}

async function validateRuleCombination(data, db = prisma) {
  if (data.device_id !== null && data.device_id !== undefined) {
    const observedTypeIds = await repository.findDeviceAssetTypeProfile(data.device_id, db);
    if (observedTypeIds.length && !observedTypeIds.includes(Number(data.asset_type_id))) {
      throw new AppError(
        'El tipo de activo no coincide con la clasificación genérica ya utilizada por este equipo.',
        400
      );
    }
  }
}

function mapRule(rule) {
  return {
    id: rule.id,
    scope: rule.device_id === null ? 'GENERIC' : 'DEVICE',
    device: rule.device,
    device_id: rule.device_id,
    classification: rule.classification,
    asset_type: rule.asset_type,
    extension: rule.extension,
    administrative_area: rule.administrative_area,
    active: rule.active,
    is_default: rule.is_default,
    created_at: rule.created_at,
    updated_at: rule.updated_at,
  };
}

export const list = async (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const take = Math.min(Number(query.limit) || 25, 200);
  const where = {
    ...(query.device_id !== undefined && { device_id: Number(query.device_id) }),
    ...(query.asset_type_id !== undefined && { asset_type_id: Number(query.asset_type_id) }),
    ...(query.extension_id !== undefined && { extension_id: Number(query.extension_id) }),
    ...(query.administrative_area_id !== undefined && {
      administrative_area_id: Number(query.administrative_area_id),
    }),
    ...(query.active !== undefined && { active: query.active === true || query.active === 'true' }),
  };
  const [rows, total] = await Promise.all([
    repository.findMany({ where, skip: (page - 1) * take, take }),
    repository.count(where),
  ]);
  return {
    data: rows.map(mapRule),
    page,
    limit: take,
    total,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
};

export const getById = async (id) => {
  const rule = await repository.findById(parseId(id, 'ID'));
  if (!rule) throw new AppError('Regla de clasificación no encontrada', 404);
  return mapRule(rule);
};

export const create = async (payload, currentUser) => {
  const data = normalizePayload(payload);
  await validateReferences(data);
  await assertDeviceRuleAvailable(data.device_id);
  await assertGenericRuleAvailable(data);
  try {
    return mapRule(
      await repository.withTransaction(async (tx) => {
        await validateRuleCombination(data, tx);
        await assertGenericRuleAvailable(data, null, tx);
        const rule = await repository.create(data, tx);
        await syncInventoryClassification({
          db: tx,
          deviceIds: [data.device_id],
          userId: currentUser?.id,
        });
        return rule;
      })
    );
  } catch (error) {
    if (error.code === 'P2002') {
      const message =
        data.device_id === null
          ? 'Ya existe una regla genérica para esta clasificación y alcance.'
          : DEVICE_RULE_CONFLICT_MESSAGE;
      throw new AppError(message, 409, 'DUPLICATE_CLASSIFICATION_RULE');
    }
    throw error;
  }
};

export const update = async (id, payload, currentUser) => {
  const ruleId = parseId(id, 'ID');
  const current = await repository.findById(ruleId);
  if (!current) throw new AppError('Regla de clasificación no encontrada', 404);
  const data = normalizePayload({ ...current, ...payload }, { partial: false });
  await validateReferences(data);
  await assertDeviceRuleAvailable(data.device_id, ruleId);
  await assertGenericRuleAvailable(data, ruleId);
  try {
    return mapRule(
      await repository.withTransaction(async (tx) => {
        await validateReferences(data, tx);
        await validateRuleCombination(data, tx);
        await assertGenericRuleAvailable(data, ruleId, tx);
        const updated = await repository.update(ruleId, data, tx);
        await syncInventoryClassification({
          db: tx,
          deviceIds: [current.device_id, data.device_id],
          userId: currentUser?.id,
        });
        if (current.active !== data.active) {
          await tx.activity_logs.create({
            data: {
              entity_type: 'INVENTORY_ASSET_CLASSIFICATION_RULES',
              entity_id: ruleId,
              action: 'STATUS_CHANGE',
              old_values: { active: current.active },
              new_values: { active: data.active, event: data.active ? 'ACTIVATE' : 'DEACTIVATE' },
              user_id: currentUser?.id ?? null,
              source: 'inventory.classification-rules.update',
            },
          });
        }
        return updated;
      })
    );
  } catch (error) {
    if (error.code === 'P2002') {
      const message =
        data.device_id === null
          ? 'Ya existe una regla genérica para esta clasificación y alcance.'
          : DEVICE_RULE_CONFLICT_MESSAGE;
      throw new AppError(message, 409, 'DUPLICATE_CLASSIFICATION_RULE');
    }
    throw error;
  }
};

export const setActive = async (id, active, currentUser) => {
  const ruleId = parseId(id, 'ID');
  if (typeof active !== 'boolean') throw new AppError('active debe ser booleano', 400);
  return repository
    .withTransaction(async (tx) => {
      const current = await repository.findById(ruleId, tx);
      if (!current) throw new AppError('Regla de clasificación no encontrada', 404);
      if (active)
        await validateReferences(
          {
            ...current,
            device_id: current.device_id,
            extension_id: current.extension_id,
            administrative_area_id: current.administrative_area_id,
          },
          tx
        );
      const updated = await repository.update(ruleId, { active }, tx);
      await syncInventoryClassification({
        db: tx,
        deviceIds: [current.device_id],
        userId: currentUser?.id,
      });
      await tx.activity_logs.create({
        data: {
          entity_type: 'INVENTORY_ASSET_CLASSIFICATION_RULES',
          entity_id: ruleId,
          action: 'STATUS_CHANGE',
          old_values: { active: current.active },
          new_values: { active, event: active ? 'ACTIVATE' : 'DEACTIVATE' },
          user_id: currentUser?.id ?? null,
          source: 'inventory.classification-rules.status',
        },
      });
      return mapRule(updated);
    })
    .catch((error) => {
      if (error.code === 'P2002') throw new AppError(DEVICE_RULE_CONFLICT_MESSAGE, 409);
      throw error;
    });
};

export const remove = async (id) => {
  const ruleId = parseId(id, 'ID');
  const count = await repository.countInventoryReferences(ruleId);
  if (count > 0)
    throw new AppError('La regla está referenciada por inventario; debe desactivarse', 409);
  throw new AppError('La eliminación física de reglas no está permitida; debe desactivarse', 409);
};

export const getCatalogs = async (options = {}) => {
  const findAssetTypes = options.findAssetTypes ?? repository.findActiveAssetTypes;
  const findAssetExtensions = options.findAssetExtensions ?? repository.findActiveAssetExtensions;
  const findAdministrativeAreas =
    options.findAdministrativeAreas ?? repository.findAdministrativeAreas;
  const findClassifications =
    options.findClassifications ?? repository.findAssignableClassifications;

  const [assetTypes, extensions, administrativeAreas, classifications] = await Promise.all([
    findAssetTypes(),
    findAssetExtensions(),
    findAdministrativeAreas(),
    findClassifications(),
  ]);

  return { assetTypes, extensions, administrativeAreas, classifications };
};

export const getAssetTypes = async () => repository.findActiveAssetTypes();
export const getAssetExtensions = async () => repository.findActiveAssetExtensions();
export const getAdministrativeAreas = async () => repository.findAdministrativeAreas();
export const getClassifications = async () => repository.findAssignableClassifications();
export const getDeviceAssetTypeProfiles = async () => repository.findDeviceAssetTypeProfiles();

export const resolve = async ({
  device_id,
  asset_type_id,
  extension_id,
  administrative_area_id,
} = {}) =>
  resolveClassificationRule({
    deviceId: parseId(device_id, 'device_id'),
    assetTypeId: parseId(asset_type_id, 'asset_type_id'),
    extensionId: parseId(extension_id, 'extension_id'),
    administrativeAreaId: parseId(administrative_area_id, 'administrative_area_id'),
  });

export { mapRule, normalizePayload, validateReferences };
