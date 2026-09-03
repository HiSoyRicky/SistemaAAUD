import { prisma } from '../../config/prisma.js';
import AppError from '../../common/utils/AppError.js';

const itemSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  unit: true,
  category: true,
  min_stock: true,
  active: true,
  stock: { select: { quantity: true } },
};

const stockInclude = {
  item: { select: itemSelect },
  ubication: { select: { id: true, name: true } },
};

const movementInclude = {
  item: { select: itemSelect },
  ubication: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  user: { select: { id: true, nombre_completo: true } },
};

export const findItems = async ({ where = {}, skip = 0, take = 100 } = {}) =>
  prisma.warehouseItem.findMany({
    where,
    select: itemSelect,
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    skip,
    take,
  });

export const countItems = async (where = {}) => prisma.warehouseItem.count({ where });

export const findItemById = async (id, db = prisma) =>
  db.warehouseItem.findUnique({
    where: { id: Number(id) },
    select: itemSelect,
  });

export const createItem = async (data) =>
  prisma.warehouseItem.create({
    data,
    select: itemSelect,
  });

export const updateItem = async (id, data) =>
  prisma.warehouseItem.update({
    where: { id: Number(id) },
    data,
    select: itemSelect,
  });

export const findUbicationById = async (id, db = prisma) =>
  db.ubications.findUnique({
    where: { id: Number(id) },
    select: { id: true, name: true },
  });

export const findDepartmentById = async (id, db = prisma) =>
  db.departments.findUnique({
    where: { id: Number(id) },
    select: { id: true, name: true, id_ubication: true },
  });

export const findWarehouseDepartment = async (db = prisma) =>
  db.departments.findFirst({
    where: {
      name: { equals: 'Almacén', mode: 'insensitive' },
      ubications: { name: { equals: 'Carrasquilla', mode: 'insensitive' } },
    },
    select: { id: true, name: true, id_ubication: true },
    orderBy: { id: 'asc' },
  });

export const findUserById = async (id, db = prisma) =>
  db.users.findUnique({
    where: { id: Number(id) },
    select: { id: true, nombre_completo: true, username: true },
  });

export const findStock = async ({ where = {}, skip = 0, take = 100 } = {}) =>
  prisma.warehouseStock.findMany({
    where,
    include: stockInclude,
    orderBy: [{ item: { name: 'asc' } }, { ubication: { name: 'asc' } }],
    skip,
    take,
  });

export const countStock = async (where = {}) => prisma.warehouseStock.count({ where });

export const findMovements = async ({ where = {}, skip = 0, take = 100 } = {}) =>
  prisma.warehouseMovement.findMany({
    where,
    include: movementInclude,
    orderBy: { created_at: 'desc' },
    skip,
    take,
  });

export const countMovements = async (where = {}) => prisma.warehouseMovement.count({ where });

export const createMovementWithStock = async ({
  itemId,
  ubicationId,
  movementType,
  quantity,
  departmentId,
  receiverName,
  vehicleTarget,
  reference,
  observation,
  createdBy,
}) =>
  prisma.$transaction(async (tx) => {
    if (movementType === 'OUT') {
      const stockRows = await tx.$queryRaw`
        SELECT id, item_id, ubication_id, quantity
        FROM warehouse_stock
        WHERE item_id = ${itemId}
        ORDER BY CASE WHEN ubication_id = ${ubicationId} THEN 0 ELSE 1 END,
                 quantity DESC,
                 id ASC
        FOR UPDATE
      `;
      const totalStock = stockRows.reduce((total, row) => total + Number(row.quantity), 0);

      if (totalStock < quantity) {
        throw new AppError('Stock institucional insuficiente', 400);
      }

      let remaining = quantity;
      const previousTotalStock = totalStock;
      for (const stockRow of stockRows) {
        if (remaining <= 0) break;
        const consumed = Math.min(Number(stockRow.quantity), remaining);
        if (consumed <= 0) continue;

        const previousStock = Number(stockRow.quantity);
        const newStock = previousStock - consumed;
        await tx.warehouseStock.update({
          where: { id: Number(stockRow.id) },
          data: { quantity: newStock },
        });
        remaining -= consumed;
      }

      return tx.warehouseMovement.create({
        data: {
          item_id: itemId,
          ubication_id: ubicationId,
          movement_type: movementType,
          quantity,
          previous_stock: previousTotalStock,
          new_stock: previousTotalStock - quantity,
          department_id: departmentId,
          receiver_name: receiverName,
          vehicle_target: vehicleTarget,
          reference,
          observation,
          created_by: createdBy,
        },
        include: movementInclude,
      });
    }

    const currentStock = await tx.warehouseStock.upsert({
      where: {
        item_id_ubication_id: {
          item_id: itemId,
          ubication_id: ubicationId,
        },
      },
      create: {
        item_id: itemId,
        ubication_id: ubicationId,
        quantity: 0,
      },
      update: {},
    });

    const previousStock = currentStock.quantity;
    const newStock =
      movementType === 'IN'
        ? previousStock + quantity
        : movementType === 'OUT'
          ? previousStock - quantity
          : quantity;

    if (newStock < 0) {
      throw new AppError('Stock insuficiente', 400);
    }

    await tx.warehouseStock.update({
      where: { id: currentStock.id },
      data: { quantity: newStock },
    });

    return tx.warehouseMovement.create({
      data: {
        item_id: itemId,
        ubication_id: ubicationId,
        movement_type: movementType,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        department_id: departmentId,
        receiver_name: receiverName,
        vehicle_target: vehicleTarget,
        reference,
        observation,
        created_by: createdBy,
      },
      include: movementInclude,
    });
  }, { maxWait: 10000, timeout: 120000 });

export const createBatchOutWithStock = async ({ items, ubicationId, departmentId, receiverName, createdBy }) =>
  prisma.$transaction(async (tx) => {
    const created = [];
    for (const line of items) {
      const stockRows = await tx.$queryRaw`
        SELECT id, ubication_id, quantity FROM warehouse_stock
        WHERE item_id = ${line.itemId} AND quantity > 0
        ORDER BY CASE WHEN ubication_id = ${ubicationId} THEN 0 ELSE 1 END, quantity DESC, id ASC
        FOR UPDATE
      `;
      const total = stockRows.reduce((sum, row) => sum + Number(row.quantity), 0);
      if (total < line.quantity) throw new AppError(`Stock institucional insuficiente para el insumo ${line.itemId}`, 400);

      let remaining = line.quantity;
      for (const row of stockRows) {
        if (!remaining) break;
        const consumed = Math.min(Number(row.quantity), remaining);
        await tx.warehouseStock.update({ where: { id: Number(row.id) }, data: { quantity: Number(row.quantity) - consumed } });
        remaining -= consumed;
      }

      created.push(await tx.warehouseMovement.create({
        data: {
          item_id: line.itemId,
          quantity: line.quantity,
          movement_type: 'OUT',
          previous_stock: total,
          new_stock: total - line.quantity,
          ubication_id: ubicationId,
          department_id: departmentId,
          receiver_name: receiverName,
          created_by: createdBy,
        },
        include: movementInclude,
      }));
    }
    return created;
  }, { maxWait: 10000, timeout: 120000 });

export const createBatchInWithStock = async ({ items, ubicationId, departmentId, receiverName, createdBy }) =>
  prisma.$transaction(async (tx) => {
    const created = [];
    for (const line of items) {
      const stock = await tx.warehouseStock.upsert({
        where: { item_id_ubication_id: { item_id: line.itemId, ubication_id: ubicationId } },
        create: { item_id: line.itemId, ubication_id: ubicationId, quantity: 0 },
        update: {},
      });
      const previousStock = Number(stock.quantity);
      const newStock = previousStock + line.quantity;
      await tx.warehouseStock.update({ where: { id: stock.id }, data: { quantity: newStock } });
      created.push(await tx.warehouseMovement.create({
        data: {
          item_id: line.itemId,
          quantity: line.quantity,
          movement_type: 'IN',
          previous_stock: previousStock,
          new_stock: newStock,
          ubication_id: ubicationId,
          department_id: departmentId,
          receiver_name: receiverName,
          created_by: createdBy,
        },
        include: movementInclude,
      }));
    }
    return created;
  }, { maxWait: 10000, timeout: 120000 });
