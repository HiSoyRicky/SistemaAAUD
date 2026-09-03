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
    device_id: deviceId === null ? null : Number(deviceId),
    ...(deviceId !== null && {
      administrative_area_id:
        administrativeAreaId === null ? null : Number(administrativeAreaId),
      extension_id: extensionId === null ? null : Number(extensionId),
    }),
    classification: { is: { active: true, is_assignable: true } },
    asset_type: { is: { active: true } },
    ...(deviceId === null && {
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
  db.bd_inventory.count({ where: { asset_classification_rule_id: Number(id) } });

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