// users.repository.js

import { prisma } from '../../config/prisma.js';

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
  departments: { select: { id: true, name: true } },
};

export const findAll = async () => {
  return prisma.users.findMany({
    select: userSelect,
  });
};

export const findTechnicians = async () => {
  return prisma.users.findMany({
    where: {
      active: true,
      roles: { name: { contains: 'tecnic', mode: 'insensitive' } },
    },
    select: userSelect,
  });
};

export const findRoles = async () => {
  return prisma.roles.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

export const searchByQuery = async (q) => {
  return prisma.users.findMany({
    where: {
      active: true,
      email: { not: null },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { nombre_completo: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      nombre_completo: true,
      email: true,
    },
    orderBy: { nombre_completo: 'asc' },
    take: 15,
  });
};

export const findByUsername = async (username) => {
  return prisma.users.findFirst({
    where: { username },
  });
};

export const findById = async (id) => {
  return prisma.users.findUnique({
    where: { id: Number(id) },
  });
};

export const findUbicationById = async (id) =>
  prisma.ubications.findUnique({ where: { id: Number(id) }, select: { id: true } });

export const findDepartmentById = async (id) =>
  prisma.departments.findUnique({
    where: { id: Number(id) },
    select: { id: true, id_ubication: true },
  });

export const create = async (data) => {
  return prisma.users.create({ data });
};

export const updateById = async (id, data) => {
  return prisma.users.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteById = async (id) => {
  return prisma.users.delete({
    where: { id: Number(id) },
  });
};

export const countUserHistory = async (id) => {
  const [
    reportedIncidents,
    assignedIncidents,
    tonerMovements,
    transferRequests,
    approvedTransfers,
    activityLogs,
    userPermissions,
  ] = await Promise.all([
    prisma.bd_incidents.count({
      where: { id_user: id },
    }),

    prisma.bd_incidents.count({
      where: { id_technician: id },
    }),

    prisma.toner_movements.count({
      where: { id_user: id },
    }),

    prisma.inventory_transfer_requests.count({
      where: { requester_id: id },
    }),

    prisma.inventory_transfer_requests.count({
      where: { approver_id: id },
    }),

    prisma.activity_logs.count({
      where: { user_id: id },
    }),

    prisma.user_permissions.count({
      where: { id_user: id },
    }),
  ]);

  return {
    reportedIncidents,
    assignedIncidents,
    tonerMovements,
    transferRequests,
    approvedTransfers,
    activityLogs,
    userPermissions,
  };
};
