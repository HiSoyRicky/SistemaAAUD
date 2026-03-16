import { prisma } from '../../config/prisma.js';

export const findAll = async () => {
  return prisma.ubications.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  });
};

export const findById = async (id) => {
  return prisma.ubications.findUnique({
    where: { id: Number(id) }
  });
};

export const updateById = async (id, data) => {
  return prisma.ubications.update({
    where: { id: Number(id) },
    data
  });
};

export const create = (data) => {
  return prisma.ubications.create({
    data: {
      name: data.name
    }
  });
};