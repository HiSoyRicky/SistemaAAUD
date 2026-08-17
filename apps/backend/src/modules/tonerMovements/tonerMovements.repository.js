// tonerMovements.repository.js

import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

const movementInclude = {
  toner: {
    include: {
      models: {
        include: {
          brands: true,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      nombre_completo: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  ubication: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const withTransaction = async (callback) => {
  return prisma.$transaction(async (tx) => callback(tx));
};

export const findMovements = async ({ where, skip, take }) => {
  return prisma.toner_movements.findMany({
    where,
    include: movementInclude,
    orderBy: { created_at: 'desc' },
    skip,
    take,
  });
};

export const countMovements = async (where) => {
  return prisma.toner_movements.count({ where });
};

export const countMovementsByType = async (where) => {
  return prisma.toner_movements.groupBy({
    by: ['movement_type'],
    where,
    _count: {
      _all: true,
    },
  });
};

export const findTonerByIdWithStock = async (id, db = prisma) => {
  const tonerId = Number(id);

  await db.$queryRaw(
    Prisma.sql`
      SELECT id
      FROM toners
      WHERE id = ${tonerId}
      FOR UPDATE
    `
  );

  return db.toners.findUnique({
    where: { id: tonerId },
    include: { stock: true },
  });
};

export const findDepartmentById = async (id, db = prisma) => {
  return db.departments.findUnique({
    where: { id: Number(id) },
  });
};

export const upsertTonerStock = async ({ tonerId, quantity }, db = prisma) => {
  return db.toner_stock.upsert({
    where: { id_toner: Number(tonerId) },
    update: { quantity: Number(quantity) },
    create: {
      id_toner: Number(tonerId),
      quantity: Number(quantity),
    },
  });
};

export const createMovement = async (data, db = prisma) => {
  return db.toner_movements.create({
    data,
    include: movementInclude,
  });
};

export const findMovementById = async (id) => {
  return prisma.toner_movements.findUnique({
    where: { id: Number(id) },
  });
};

export const updateMovementDocument = async ({ movementId, data }) => {
  return prisma.toner_movements.update({
    where: { id: Number(movementId) },
    data,
    include: movementInclude,
  });
};
