// inventory.repository.js

import { prisma } from '../../config/prisma.js';

const includeRelations = {
  devices: { select: { id: true, name: true } },
  brands: { select: { id: true, name: true } },
  models: { select: { id: true, name: true } },
  inventory_devices: {
    include: {
      device: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      model: { select: { id: true, name: true } },
    },
  },
  departments: { select: { id: true, name: true } },
  ubications: { select: { id: true, name: true } },
  status: { select: { id: true, name: true } },
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
            {
              inventory_devices: {
                is: { ip: { contains: search, mode: 'insensitive' } },
              },
            },
            { observation: { contains: search, mode: 'insensitive' } },
            {
              inventory_devices: {
                is: {
                  device: { is: { name: { contains: search, mode: 'insensitive' } } },
                },
              },
            },
            {
              inventory_devices: {
                is: {
                  brand: { is: { name: { contains: search, mode: 'insensitive' } } },
                },
              },
            },
            {
              inventory_devices: {
                is: {
                  model: { is: { name: { contains: search, mode: 'insensitive' } } },
                },
              },
            },
            { departments: { is: { name: { contains: search, mode: 'insensitive' } } } },
            { ubications: { is: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {},
    include: includeRelations,
  });
};

export const findById = async (id) => {
  return prisma.bd_inventory.findUnique({
    where: { id: Number(id) },
    include: includeRelations,
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
      entity_type: { in: ['BD_INVENTORY', 'INVENTORY_DEVICES'] },
      ...(inventoryId && { entity_id: Number(inventoryId) }),
      ...(action && { action }),
      ...((from || to) && {
        created_at: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
    },
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          nombre_completo: true,
        },
      },
    },
  });
};

export const findUbicationsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.ubications.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findDepartmentsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.departments.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findStatusesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.status.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findDevicesByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.devices.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findBrandsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.brands.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
};

export const findModelsByIds = async (ids = []) => {
  if (!ids.length) return [];

  return prisma.models.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
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
      inventory_devices: {
        include: {
          device: { select: { name: true } },
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      },
    },
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

export const createWithTechnology = async ({ inventoryData, technologyData }) => {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.bd_inventory.create({
      data: inventoryData,
    });

    await tx.inventory_devices.create({
      data: {
        ...technologyData,
        id_inventory: inventory.id,
      },
    });

    return tx.bd_inventory.findUnique({
      where: { id: inventory.id },
      include: includeRelations,
    });
  });
};

export const updateWithTechnology = async ({
  id,
  inventoryData,
  technologyData,
  updateTechnology = true,
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.bd_inventory.update({
      where: { id: Number(id) },
      data: inventoryData,
    });

    if (updateTechnology) {
      await tx.inventory_devices.upsert({
        where: { id_inventory: Number(id) },
        create: {
          ...technologyData,
          id_inventory: Number(id),
        },
        update: technologyData,
      });
    }

    return tx.bd_inventory.findUnique({
      where: { id: Number(id) },
      include: includeRelations,
    });
  });
};
