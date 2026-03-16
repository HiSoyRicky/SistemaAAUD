import { prisma } from '../../config/prisma.js';

export const findAll = async () => {
  return prisma.devices.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
};

export const findById = async (id) => {
  return prisma.devices.findUnique({ where: { id: Number(id) } });
};

export const findByName = async (name) => {
  return prisma.devices.findFirst({ where: { name } });
};

export const create = async (data) => {
  return prisma.devices.create({ data });
};

export const updateById = async (id, data) => {
  return prisma.devices.update({
    where: { id: Number(id) },
    data
  });
};

export const deleteById = async (id) => {
  return prisma.devices.delete({
    where: { id: Number(id) }
  });
};
