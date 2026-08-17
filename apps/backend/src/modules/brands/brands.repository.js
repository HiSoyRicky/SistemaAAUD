// brands.repository.js

import { prisma } from '../../config/prisma.js';

export const findAll = async () => {
  return prisma.brands.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
};

export const findById = async (id) => {
  return prisma.brands.findUnique({ where: { id: Number(id) } });
};

export const findByName = async (name, excludeId = null) => {
  return prisma.brands.findFirst({
    where: {
      name,
      ...(excludeId ? { id: { not: Number(excludeId) } } : {}),
    },
  });
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
  return prisma.bd_inventory.count({
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
