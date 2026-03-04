import { prisma } from '../../Prisma.js';

const userSelect = {
  id: true,
  nombre_completo: true,
  username: true,
  id_department: true,
  email: true,
  id_rol: true,
  active: true,
  id_ubication: true,
  ubications: { select: { id: true, name: true } },
  departments: { select: { id: true, name: true } }
};

export const findAll = async () => {
  return prisma.users.findMany({
    select: userSelect
  });
};

export const findTechnicians = async () => {
  return prisma.users.findMany({
    where: { id_rol: 2 },
    select: userSelect
  });
};

export const findRoles = async () => {
  return prisma.roles.findMany({
    select: {
      id: true,
      name: true
    }
  });
};

export const searchByQuery = async (q) => {
  return prisma.users.findMany({
    where: {
      active: true,
      email: { not: null },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { nombre_completo: { contains: q, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      nombre_completo: true,
      email: true
    },
    orderBy: { nombre_completo: 'asc' },
    take: 15
  });
};

export const findByUsername = async (username) => {
  return prisma.users.findFirst({
    where: { username }
  });
};

export const findById = async (id) => {
  return prisma.users.findUnique({
    where: { id: Number(id) }
  });
};

export const create = async (data) => {
  return prisma.users.create({ data });
};

export const updateById = async (id, data) => {
  return prisma.users.update({
    where: { id: Number(id) },
    data
  });
};

export const deleteById = async (id) => {
  return prisma.users.delete({
    where: { id: Number(id) }
  });
};
