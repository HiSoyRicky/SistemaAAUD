import { prisma } from '../../config/prisma.js';

const relationSelect = {
  device: { select: { id: true, name: true } },
  classification: {
    select: {
      id: true,
      code_new: true,
      description: true,
      parent_id: true,
      level: true,
      active: true,
      is_assignable: true,
    },
  },
  asset_type: { select: { id: true, code: true, name: true, active: true } },
  extension: { select: { id: true, code: true, name: true, active: true } },
  administrative_area: { select: { id: true, name: true } },
};

export const findById = async (id, db = prisma) =>
  db.inventory_asset_classification_rules.findUnique({
    where: { id: Number(id) },
    include: relationSelect,
  });

export const findActiveByScope = async (
  { deviceId = null, assetTypeId = null, extensionId = null, administrativeAreaId = null, isDefault },
  db = prisma
) => {
  const where = {
    active: true,
    classification: { is: { active: true, is_assignable: true } },
    asset_type: { is: { active: true } },
    ...(deviceId !== null
      ? { device_id: Number(deviceId) }
      : {
          device_id: null,
          asset_type_id: Number(assetTypeId),
          extension_id: extensionId === null ? null : Number(extensionId),
          administrative_area_id:
            administrativeAreaId === null ? null : Number(administrativeAreaId),
          ...(isDefault !== undefined && { is_default: isDefault }),
          ...(extensionId !== null && { extension: { is: { active: true } } }),
        }),
  };

  return db.inventory_asset_classification_rules.findFirst({
    where,
    include: relationSelect,
    orderBy: { id: 'asc' },
  });
};

export const findActiveDeviceRules = async (db = prisma) =>
  db.inventory_asset_classification_rules.findMany({
    where: {
      active: true,
      device_id: { not: null },
      classification: { is: { active: true, is_assignable: true } },
      asset_type: { is: { active: true } },
      OR: [{ extension_id: null }, { extension: { is: { active: true } } }],
    },
    select: { id: true, device_id: true, administrative_area_id: true },
  });

export const findOtherByDevice = async (deviceId, excludeRuleId = null, db = prisma) =>
  db.inventory_asset_classification_rules.findFirst({
    where: {
      device_id: Number(deviceId),
      ...(excludeRuleId !== null && { id: { not: Number(excludeRuleId) } }),
    },
    select: { id: true },
  });

export const findOtherGenericExactRule = async (
  { classificationId, assetTypeId, extensionId, administrativeAreaId },
  excludeRuleId = null,
  db = prisma
) =>
  db.inventory_asset_classification_rules.findFirst({
    where: {
      device_id: null,
      classification_id: Number(classificationId),
      asset_type_id: Number(assetTypeId),
      extension_id: extensionId == null ? null : Number(extensionId),
      administrative_area_id: administrativeAreaId == null ? null : Number(administrativeAreaId),
      ...(excludeRuleId !== null && { id: { not: Number(excludeRuleId) } }),
    },
    select: { id: true },
  });

export const findDeviceAssetTypeProfiles = async (db = prisma) => {
  const rows = await db.inventory_item_devices.findMany({
    select: {
      id_device: true,
      item: {
        select: {
          asset_classification_rule: {
            select: { device_id: true, asset_type_id: true },
          },
        },
      },
    },
  });
  const profiles = new Map();

  for (const row of rows) {
    const rule = row.item?.asset_classification_rule;
    // Ignora la regla específica del propio equipo: no es evidencia externa
    // para decidir si esa misma regla está bien configurada.
    if (!rule || rule.device_id != null) continue;
    const assetTypeIds = profiles.get(row.id_device) || new Set();
    assetTypeIds.add(rule.asset_type_id);
    profiles.set(row.id_device, assetTypeIds);
  }

  return [...profiles].map(([device_id, asset_type_ids]) => ({
    device_id,
    asset_type_ids: [...asset_type_ids],
  }));
};

export const findDeviceAssetTypeProfile = async (deviceId, db = prisma) => {
  const rows = await db.inventory_item_devices.findMany({
    where: { id_device: Number(deviceId) },
    select: {
      item: {
        select: {
          asset_classification_rule: {
            select: { device_id: true, asset_type_id: true },
          },
        },
      },
    },
  });
  return [
    ...new Set(
      rows
        .map((row) => row.item?.asset_classification_rule)
        .filter((rule) => rule && rule.device_id == null)
        .map((rule) => rule.asset_type_id)
    ),
  ];
};

export const findMany = async ({ where = {}, skip = 0, take = 100 } = {}, db = prisma) =>
  db.inventory_asset_classification_rules.findMany({
    where,
    include: relationSelect,
    orderBy: [{ device_id: 'asc' }, { id: 'asc' }],
    skip,
    take,
  });

export const count = async (where = {}, db = prisma) =>
  db.inventory_asset_classification_rules.count({ where });

export const create = async (data, db = prisma) =>
  db.inventory_asset_classification_rules.create({ data, include: relationSelect });

export const update = async (id, data, db = prisma) =>
  db.inventory_asset_classification_rules.update({
    where: { id: Number(id) },
    data,
    include: relationSelect,
  });

export const countInventoryReferences = async (id, db = prisma) =>
  db.inventory_items.count({ where: { asset_classification_rule_id: Number(id) } });

export const findReferences = async ({ deviceId, classificationId, assetTypeId, extensionId, areaId }, db = prisma) => {
  const [device, classification, assetType, extension, area] = await Promise.all([
    deviceId === null ? null : db.devices.findUnique({ where: { id: Number(deviceId) } }),
    db.inventory_asset_classifications.findUnique({ where: { id: Number(classificationId) } }),
    db.inventory_asset_types.findUnique({ where: { id: Number(assetTypeId) } }),
    extensionId === null ? null : db.inventory_asset_extensions.findUnique({ where: { id: Number(extensionId) } }),
    areaId === null ? null : db.inventory_administrative_areas.findUnique({ where: { id: Number(areaId) } }),
  ]);

  return { device, classification, assetType, extension, area };
};

export const withTransaction = (callback) => prisma.$transaction(callback);

export const findActiveAssetTypes = async (db = prisma) =>
  db.inventory_asset_types.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true, description: true, active: true },
  });

export const findActiveAssetExtensions = async (db = prisma) =>
  db.inventory_asset_extensions.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true, description: true, active: true },
  });

export const findAdministrativeAreas = async (db = prisma) =>
  db.inventory_administrative_areas.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

export const findAssignableClassifications = async (db = prisma) =>
  db.inventory_asset_classifications.findMany({
    where: { active: true, is_assignable: true },
    orderBy: { code_new: 'asc' },
    select: {
      id: true,
      code_new: true,
      description: true,
      parent_id: true,
      level: true,
      active: true,
      is_assignable: true,
    },
  });
