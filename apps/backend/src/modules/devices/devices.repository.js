// devices.repository.js

import { prisma } from '../../config/prisma.js';
import normalizeCatalogName from '../../common/utils/normalizeCatalogName.js';

export const findAll = async () => {
  return prisma.devices.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
};

export const findById = async (id) => {
  return prisma.devices.findUnique({ where: { id: Number(id) } });
};

export const findByName = async (name, exceptId = null) => {
  const normalized = normalizeCatalogName(name);
  const rows = await prisma.devices.findMany({ select: { id: true, name: true } });
  return rows.find(
    (row) => Number(row.id) !== Number(exceptId) && normalizeCatalogName(row.name) === normalized
  ) || null;
};

export const create = async (data) => {
  return prisma.devices.create({ data });
};

export const updateById = async (id, data) => {
  return prisma.devices.update({
    where: { id: Number(id) },
    data,
  });
};

export const countInventoryByDeviceId = async (id) => {
  return prisma.inventory_item_devices.count({
    where: { id_device: Number(id) },
  });
};

export const countModelsByDeviceId = async (id) => {
  return prisma.models.count({
    where: { id_device: Number(id) },
  });
};

export const deleteById = async (id) => {
  return prisma.devices.delete({
    where: { id: Number(id) },
  });
};
