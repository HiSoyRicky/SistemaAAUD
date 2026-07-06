import { prisma } from '../../config/prisma.js';

const includeRelations = {
  devices: { select: { id: true, name: true } },
  brands: { select: { id: true, name: true } },
  models: { select: { id: true, name: true } },
  departments: { select: { id: true, name: true } },
  ubications: { select: { id: true, name: true } },
  status: { select: { id: true, name: true } }
};

let inventoryLocationNullableCache = null;

export const findAll = async (search) => {
  return prisma.bd_inventory.findMany({
    where: search
      ? {
          OR: [
            { serie: { contains: search, mode: 'insensitive' } },
            { tag: { contains: search, mode: 'insensitive' } },
            { user: { contains: search, mode: 'insensitive' } },
            { ip: { contains: search, mode: 'insensitive' } },
            { observation: { contains: search, mode: 'insensitive' } },
            { devices: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { brands: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { models: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { departments: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { ubications: { is: { name: { contains: search, mode: 'insensitive' } } } }
          ]
        }
      : {},
    include: includeRelations
  });
};

export const findById = async (id) => {
  return prisma.bd_inventory.findUnique({
    where: { id: Number(id) }
  });
};

export const findUbicationById = async (id) => {
  return prisma.ubications.findUnique({ where: { id: Number(id) } });
};

export const findDepartmentById = async (id) => {
  return prisma.departments.findUnique({ where: { id: Number(id) } });
};

export const findDeviceById = async (id) => {
  return prisma.devices.findUnique({ where: { id: Number(id) } });
};

export const findBrandById = async (id) => {
  return prisma.brands.findUnique({ where: { id: Number(id) } });
};

export const findModelById = async (id) => {
  return prisma.models.findUnique({ where: { id: Number(id) } });
};

export const findStatusById = async (id) => {
  return prisma.status.findUnique({ where: { id: Number(id) } });
};

export const findInventoryMovementLogs = async ({ action, from, to, inventoryId }) => {
  return prisma.activity_logs.findMany({
    where: {
      entity_type: 'BD_INVENTORY',
      ...(inventoryId && { entity_id: Number(inventoryId) }),
      ...(action && { action }),
      ...((from || to) && {
        created_at: {
          ...(from && { gte: from }),
          ...(to && { lte: to })
        }
      })
    },
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          nombre_completo: true
        }
      }
    }
  });
};

export const findUbicationsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.ubications.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
};

export const findDepartmentsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.departments.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
};

export const findStatusesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.status.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
};

export const findDevicesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.devices.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
};

export const findBrandsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.brands.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
};

export const findModelsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.models.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
};

export const findCurrentInventoryByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.bd_inventory.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      ubications: { select: { name: true } },
      departments: { select: { name: true } },
      status: { select: { name: true } },
      devices: { select: { name: true } },
      brands: { select: { name: true } },
      models: { select: { name: true } }
    }
  });
};

export const areInventoryLocationFieldsNullable = async () => {
  if (inventoryLocationNullableCache !== null) {
    return inventoryLocationNullableCache;
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT BOOL_AND(is_nullable = 'YES') AS all_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bd_inventory'
      AND column_name IN ('id_ubication', 'id_department');
  `);

  const value = rows?.[0]?.all_nullable;
  inventoryLocationNullableCache = value === true || value === 't' || value === 'true';

  return inventoryLocationNullableCache;
};

export const create = async (data) => {
  return prisma.bd_inventory.create({
    data,
    include: includeRelations
  });
};

export const updateById = async (id, data) => {
  return prisma.bd_inventory.update({
    where: { id: Number(id) },
    data,
    include: includeRelations
  });
};
