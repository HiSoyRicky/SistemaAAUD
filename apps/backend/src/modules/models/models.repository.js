// models.repository.js

import { prisma } from '../../config/prisma.js';
import normalizeCatalogName from '../../common/utils/normalizeCatalogName.js';

export const findAll = async () => {
  return prisma.models.findMany({
    select: {
      id: true,
      name: true,
      id_brand: true,
      id_device: true,
    },
    orderBy: { name: 'asc' },
  });
};

export const findPrinterModels = async () => {
  return prisma.models.findMany({
    where: {
      devices: {
        name: 'Impresora',
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });
};

export const findById = async (id) => {
  return prisma.models.findUnique({
    where: { id: Number(id) },
  });
};

export const findBrandById = async (id) => prisma.brands.findUnique({ where: { id: Number(id) } });

export const findByNameBrandDevice = async ({ name, id_brand, id_device }) => {
  const rows = await prisma.models.findMany({ where: { id_brand, id_device } });
  return rows.find((row) => normalizeCatalogName(row.name) === normalizeCatalogName(name)) || null;
};

export const findDuplicateNameBrandDevice = async ({ name, id_brand, id_device, excludeId }) => {
  const rows = await prisma.models.findMany({
    where: { id_brand, id_device, ...(excludeId ? { id: { not: Number(excludeId) } } : {}) },
  });
  return rows.find((row) => normalizeCatalogName(row.name) === normalizeCatalogName(name)) || null;
};

export const create = async (data) => {
  return prisma.models.create({ data });
};

export const updateById = async (id, data) => {
  return prisma.models.update({
    where: { id: Number(id) },
    data,
  });
};

export const countInventoryByModelId = async (id) => {
  return prisma.inventory_item_devices.count({
    where: { id_model: Number(id) },
  });
};

export const countTonersByPrinterModelId = async (id) => {
  return prisma.toners.count({
    where: { id_printer_model: Number(id) },
  });
};

export const deleteById = async (id) => {
  return prisma.models.delete({
    where: { id: Number(id) },
  });
};
