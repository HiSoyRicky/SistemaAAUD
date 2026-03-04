import { prisma } from '../../Prisma.js';

export const findAll = async () => {
  return prisma.departments.findMany({
    select: {
      id: true,
      name: true,
      id_ubication: true,
      ubications: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  });
};

export const findById = async (id) => {
  return prisma.departments.findUnique({
    where: { id: Number(id) }
  });
};

export const findUbicationById = async (id) => {
  return prisma.ubications.findUnique({
    where: { id: Number(id) }
  });
};

export const create = async (data) => {
  return prisma.departments.create({
    data
  });
};

export const updateById = async (id, data) => {
  return prisma.departments.update({
    where: { id: Number(id) },
    data,
    select: { id: true, name: true, id_ubication: true }
  });
};

export const deleteById = async (id) => {
  return prisma.departments.delete({
    where: { id: Number(id) }
  });
};
