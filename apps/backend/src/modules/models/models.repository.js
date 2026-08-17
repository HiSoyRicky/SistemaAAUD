// models.repository.js

import { prisma } from '../../config/prisma.js';

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

export const findByNameBrandDevice = async ({ name, id_brand, id_device }) => {
  return prisma.models.findFirst({
    where: {
      name,
      id_brand,
      id_device,
    },
  });
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
  return prisma.bd_inventory.count({
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
