import { prisma } from '../../config/prisma.js';

const roleSelect = {
  id: true,
  name: true,
  _count: {
    select: { users: true, rolePermissions: true },
  },
};

export const findAll = () =>
  prisma.roles.findMany({
    orderBy: { name: 'asc' },
    select: roleSelect,
  });

export const findById = (id) =>
  prisma.roles.findUnique({
    where: { id: Number(id) },
    select: roleSelect,
  });

export const findByName = (name) =>
  prisma.roles.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, name: true },
  });

export const create = (data) => prisma.roles.create({ data, select: roleSelect });

export const update = (id, data) =>
  prisma.roles.update({
    where: { id: Number(id) },
    data,
    select: roleSelect,
  });

export const remove = (id) => prisma.roles.delete({ where: { id: Number(id) } });