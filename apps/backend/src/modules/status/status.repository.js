import { prisma } from '../../config/prisma.js';

export const findAll = async () => {
  return prisma.status.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });
};

export const findById = async (id) => {
  return prisma.status.findUnique({
    where: { id: Number(id) }
  });
};

export const create = async (data) => {
  return prisma.status.create({
    data
  });
};

export const updateById = async (id, data) => {
  return prisma.status.update({
    where: { id: Number(id) },
    data,
    select: { id: true, name: true }
  });
};
