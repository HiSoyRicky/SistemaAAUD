import { prisma } from '../../config/prisma.js';

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

export const countDependenciesByDepartmentId = async (id) => {
  const departmentId = Number(id);
  const [incidents, inventory, tonerMovements, users] = await Promise.all([
    prisma.bd_incidents.count({
      where: { id_department: departmentId }
    }),
    prisma.bd_inventory.count({
      where: { id_department: departmentId }
    }),
    prisma.toner_movements.count({
      where: { id_department: departmentId }
    }),
    prisma.users.count({
      where: { id_department: departmentId }
    })
  ]);

  return {
    incidents,
    inventory,
    tonerMovements,
    users
  };
};

export const deleteById = async (id) => {
  return prisma.departments.delete({
    where: { id: Number(id) }
  });
};
