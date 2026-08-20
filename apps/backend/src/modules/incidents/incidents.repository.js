// incidents.repository.js

import { prisma } from '../../config/prisma.js';

const listSelect = {
  id: true,
  ticket_number: true,
  id_user: true,
  reporter_name: true,
  email: true,
  description: true,
  id_category: true,
  other_category_detail: true,
  id_status: true,
  creation_date: true,
  solution_date: true,
  solution: true,
  id_technician: true,
  categories: {
    select: { name: true },
  },
  ubications: {
    select: { name: true },
  },
  departments: {
    select: { name: true },
  },
  users_bd_incidents_id_technicianTousers: {
    select: { nombre_completo: true },
  },
};

const detailSelect = {
  id: true,
  ticket_number: true,
  reporter_name: true,
  email: true,
  description: true,
  other_category_detail: true,
  creation_date: true,
  solution: true,
  solution_date: true,
  id_status: true,
  id_technician: true,
  ubications: { select: { name: true } },
  departments: { select: { name: true } },
  categories: { select: { name: true } },
  users_bd_incidents_id_technicianTousers: {
    select: {
      nombre_completo: true,
      email: true,
    },
  },
};

export const findAll = async () => {
  return prisma.bd_incidents.findMany({
    select: listSelect,
  });
};

export const findById = async (id) => {
  return prisma.bd_incidents.findUnique({
    where: { id: Number(id) },
    select: detailSelect,
  });
};

export const findUserPasswordById = async (id) => {
  return prisma.users.findUnique({
    where: { id: Number(id) },
    select: { password: true },
  });
};

export const findDepartmentById = async (id) => {
  return prisma.departments.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      id_ubication: true,
    },
  });
};

export const findPrinterModelsWithTonersByLocationDepartment = async ({
  id_ubication,
  id_department,
}) => {
  return prisma.models.findMany({
    where: {
      devices: {
        name: 'Impresora',
      },
      inventory_devices: {
        some: {
          inventory: {
            is: {
            id_ubication: Number(id_ubication),
            id_department: Number(id_department),
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      brands: {
        select: {
          name: true,
        },
      },
      toners: {
        select: {
          id: true,
          color: true,
          toner_model: true,
        },
        orderBy: [{ color: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const deleteById = async (id) => {
  return prisma.bd_incidents.deleteMany({
    where: { id: Number(id) },
  });
};
