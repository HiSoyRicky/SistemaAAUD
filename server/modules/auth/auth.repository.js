import { prisma } from '../../Prisma.js';

export const findRoleById = async (id) => {
  return prisma.roles.findUnique({
    where: { id: Number(id) },
    select: { id: true }
  });
};

export const findUserByUsername = async (username) => {
  return prisma.users.findFirst({
    where: { username },
    select: { id: true }
  });
};

export const createUser = async (data) => {
  return prisma.users.create({
    data,
    select: {
      id: true,
      username: true,
      nombre_completo: true,
      id_rol: true,
      active: true
    }
  });
};

export const findActiveUserWithRoleByUsername = async (username) => {
  return prisma.users.findFirst({
    where: {
      username,
      active: true
    },
    include: {
      roles: true
    }
  });
};
