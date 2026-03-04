import { prisma } from '../../Prisma.js';

const tonerListSelect = {
  id: true,
  color: true,
  toner_model: true,
  min_stock: true,
  stock: {
    select: {
      quantity: true
    }
  },
  models: {
    select: {
      name: true,
      brands: {
        select: {
          name: true
        }
      }
    }
  }
};

export const findAll = async () => {
  return prisma.toners.findMany({
    select: tonerListSelect,
    orderBy: { id: 'asc' }
  });
};

export const findById = async (id) => {
  return prisma.toners.findUnique({
    where: { id: Number(id) }
  });
};

export const findPrinterModelById = async (id) => {
  return prisma.models.findUnique({
    where: { id: Number(id) }
  });
};

export const createWithStock = async ({ toner_model, color, id_printer_model, min_stock }) => {
  return prisma.$transaction(async (tx) => {
    const toner = await tx.toners.create({
      data: {
        toner_model,
        color,
        id_printer_model,
        min_stock
      }
    });

    await tx.toner_stock.create({
      data: {
        id_toner: toner.id,
        quantity: 0
      }
    });

    return toner;
  });
};

export const updateById = async (id, data) => {
  return prisma.toners.update({
    where: { id: Number(id) },
    data
  });
};

export const countMovementsByTonerId = async (id) => {
  return prisma.toner_movements.count({
    where: { id_toner: Number(id) }
  });
};

export const deleteByIdWithStock = async (id) => {
  return prisma.$transaction(async (tx) => {
    await tx.toner_stock.deleteMany({
      where: { id_toner: Number(id) }
    });

    return tx.toners.delete({
      where: { id: Number(id) }
    });
  });
};
