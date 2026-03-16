import { prisma } from '../../config/prisma.js';

const includeRelations = {
  devices: { select: { id: true, name: true } },
  brands: { select: { id: true, name: true } },
  models: { select: { id: true, name: true } },
  departments: { select: { id: true, name: true } },
  ubications: { select: { id: true, name: true } },
  status: { select: { id: true, name: true } }
};

export const findAll = async (search) => {
  return prisma.bd_inventory.findMany({
    where: search
      ? {
          OR: [
            { serie: { contains: search, mode: 'insensitive' } },
            { tag: { contains: search, mode: 'insensitive' } },
            { user: { contains: search, mode: 'insensitive' } },
            { devices: { name: { contains: search, mode: 'insensitive' } } },
            { brands: { name: { contains: search, mode: 'insensitive' } } },
            { models: { name: { contains: search, mode: 'insensitive' } } },
            { departments: { name: { contains: search, mode: 'insensitive' } } },
            { ubications: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {},
    include: includeRelations
  });
};

export const findById = async (id) => {
  return prisma.bd_inventory.findUnique({
    where: { id: Number(id) }
  });
};

export const findUbicationById = async (id) => {
  return prisma.ubications.findUnique({ where: { id: Number(id) } });
};

export const findDepartmentById = async (id) => {
  return prisma.departments.findUnique({ where: { id: Number(id) } });
};

export const findDeviceById = async (id) => {
  return prisma.devices.findUnique({ where: { id: Number(id) } });
};

export const findBrandById = async (id) => {
  return prisma.brands.findUnique({ where: { id: Number(id) } });
};

export const findModelById = async (id) => {
  return prisma.models.findUnique({ where: { id: Number(id) } });
};

export const findStatusById = async (id) => {
  return prisma.status.findUnique({ where: { id: Number(id) } });
};

export const create = async (data) => {
  return prisma.bd_inventory.create({
    data,
    include: includeRelations
  });
};

export const updateById = async (id, data) => {
  return prisma.bd_inventory.update({
    where: { id: Number(id) },
    data,
    include: includeRelations
  });
};
