// brands.repository.js

import { prisma } from '../../config/prisma.js';
import normalizeCatalogName from '../../common/utils/normalizeCatalogName.js';

export const findAll = async () => {
  return prisma.brands.findMany({
    select: { id: true, name: true, catalog_type: true },
    orderBy: { name: 'asc' },
  });
};

export const findById = async (id) => {
  return prisma.brands.findUnique({ where: { id: Number(id) } });
};

export const findByName = async (name, excludeId = null) => {
  const rows = await prisma.brands.findMany();
  return rows.find(
    (row) => (excludeId == null || row.id !== Number(excludeId)) && normalizeCatalogName(row.name) === normalizeCatalogName(name)
  ) || null;
};

export const create = async (data) => {
  return prisma.brands.create({ data });
};

export const updateById = async (id, data) => {
  return prisma.brands.update({
    where: { id: Number(id) },
    data,
  });
};

export const countInventoryByBrandId = async (id) => {
  return prisma.inventory_item_devices.count({
    where: { id_brand: Number(id) },
  });
};

export const countModelsByBrandId = async (id) => {
  return prisma.models.count({
    where: { id_brand: Number(id) },
  });
};

export const deleteById = async (id) => {
  return prisma.brands.delete({
    where: { id: Number(id) },
  });
};
