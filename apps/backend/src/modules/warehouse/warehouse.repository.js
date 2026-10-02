import { prisma } from '../../config/prisma.js';
import AppError from '../../common/utils/AppError.js';

const itemSelect = {
  id: true,
  code: true,
  name: true,
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

const IDEMPOTENT_MOVEMENT_FIELDS = [
  'item_id',
  'quantity',
  'movement_type',
  'ubication_id',
  'department_id',
  'receiver_name',
  'reference',
  'observation',
  'created_by',
];

export function buildWarehouseLineIdempotencyKey(operationKey, itemId) {
  return `${operationKey}:${itemId}`;
}

export function resolveExistingIdempotentMovements(existingMovements, expectedMovements) {
  const existingByKey = new Map(
    existingMovements.map((movement) => [movement.idempotency_key, movement])
  );

  if (existingByKey.size !== expectedMovements.length) {
    throw new AppError('La clave de operación ya fue usada por otra solicitud', 409);
  }

  return expectedMovements.map((expected) => {
    const existing = existingByKey.get(expected.idempotency_key);
    if (!existing) {
      throw new AppError('La clave de operación ya fue usada por otra solicitud', 409);
    }

    const payloadMatches = IDEMPOTENT_MOVEMENT_FIELDS.every(
      (field) => JSON.stringify(existing[field] ?? null) === JSON.stringify(expected[field] ?? null)
    );
    if (!payloadMatches) {
      throw new AppError('La clave de operación ya fue usada con datos diferentes', 409);
    }

    return existing;
  });
}

async function createIdempotentMovements(expectedMovements, createMovements) {
  const idempotencyKeys = expectedMovements.map((movement) => movement.idempotency_key);
  const findExisting = (db) =>
    db.warehouseMovement.findMany({
      where: { idempotency_key: { in: idempotencyKeys } },
      include: movementInclude,
    });

  try {
    return await prisma.$transaction(
      async (tx) => {
        const existing = await findExisting(tx);
        if (existing.length) {
          return resolveExistingIdempotentMovements(existing, expectedMovements);
        }

        return createMovements(tx);
      },
      { maxWait: 10000, timeout: 120000 }
    );
  } catch (error) {
    const existing = await findExisting(prisma);
    if (existing.length) {
      return resolveExistingIdempotentMovements(existing, expectedMovements);
    }
    throw error;
  }
}

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

export const findMovements = async ({ where = {}, skip = 0, take = 100, db = prisma } = {}) =>
  db.warehouseMovement.findMany({
    where,
    include: movementInclude,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    skip,
    take,
  });

export const countMovements = async (where = {}) => prisma.warehouseMovement.count({ where });

export const summarizeMovements = async (where = {}) => {
  const rows = await prisma.warehouseMovement.groupBy({
    by: ['movement_type'],
    where,
    _sum: { quantity: true },
    _count: { _all: true },
  });
  return rows.reduce((summary, row) => {
    summary[row.movement_type] = {
      quantity: row._sum.quantity || 0,
      count: row._count._all,
    };
    return summary;
  }, { IN: { quantity: 0, count: 0 }, OUT: { quantity: 0, count: 0 }, ADJUSTMENT: { quantity: 0, count: 0 } });
};

export const createMovementWithStock = async ({
  itemId,
  ubicationId,
  movementType,
  quantity,
  departmentId,
  receiverName,
  reference,
  observation,
  createdBy,
  idempotencyKey,
}) => {
  const expected = {
    idempotency_key: idempotencyKey,
    item_id: itemId,
    quantity,
    movement_type: movementType,
    ubication_id: ubicationId,
    department_id: departmentId,
    receiver_name: receiverName,
    reference,
    observation,
    created_by: createdBy,
  };

  const [movement] = await createIdempotentMovements([expected], async (tx) => {
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
      for (const stockRow of stockRows) {
        if (remaining <= 0) break;
        const consumed = Math.min(Number(stockRow.quantity), remaining);
        if (consumed <= 0) continue;
        await tx.warehouseStock.update({
          where: { id: Number(stockRow.id) },
          data: { quantity: Number(stockRow.quantity) - consumed },
        });
        remaining -= consumed;
      }

      return [
        await tx.warehouseMovement.create({
          data: {
            ...expected,
            previous_stock: totalStock,
            new_stock: totalStock - quantity,
          },
          include: movementInclude,
        }),
      ];
    }

    const currentStock = await tx.warehouseStock.upsert({
      where: { item_id_ubication_id: { item_id: itemId, ubication_id: ubicationId } },
      create: { item_id: itemId, ubication_id: ubicationId, quantity: 0 },
      update: {},
    });
    const previousStock = Number(currentStock.quantity);
    let newStock;
    if (movementType === 'IN') {
      newStock = previousStock + quantity;
    } else if (movementType === 'ADJUSTMENT') {
      newStock = quantity;
    } else {
      newStock = previousStock - quantity;
    }

    if (newStock < 0) throw new AppError('Stock insuficiente', 400);

    await tx.warehouseStock.update({
      where: { id: currentStock.id },
      data: { quantity: newStock },
    });

    return [
      await tx.warehouseMovement.create({
        data: { ...expected, previous_stock: previousStock, new_stock: newStock },
        include: movementInclude,
      }),
    ];
  });

  return movement;
};

export const createBatchOutWithStock = async ({
  items,
  ubicationId,
  departmentId,
  receiverName,
  reference,
  observation,
  createdBy,
  idempotencyKey,
}) => {
  const expectedMovements = items.map((line) => ({
    idempotency_key: buildWarehouseLineIdempotencyKey(idempotencyKey, line.itemId),
    item_id: line.itemId,
    quantity: line.quantity,
    movement_type: 'OUT',
    ubication_id: ubicationId,
    department_id: departmentId,
    receiver_name: receiverName,
    reference: reference ?? null,
    observation: observation ?? null,
    created_by: createdBy,
  }));
  const expectedByItem = new Map(expectedMovements.map((movement) => [movement.item_id, movement]));
  const lockOrder = [...items].sort((first, second) => first.itemId - second.itemId);

  return createIdempotentMovements(expectedMovements, async (tx) => {
    const createdByKey = new Map();
    for (const line of lockOrder) {
      const expected = expectedByItem.get(line.itemId);
      const stockRows = await tx.$queryRaw`
        SELECT id, ubication_id, quantity FROM warehouse_stock
        WHERE item_id = ${line.itemId} AND quantity > 0
        ORDER BY CASE WHEN ubication_id = ${ubicationId} THEN 0 ELSE 1 END, quantity DESC, id ASC
        FOR UPDATE
      `;
      const total = stockRows.reduce((sum, row) => sum + Number(row.quantity), 0);
      if (total < line.quantity) {
        throw new AppError(`Stock institucional insuficiente para el insumo ${line.itemId}`, 400);
      }

      let remaining = line.quantity;
      for (const row of stockRows) {
        if (!remaining) break;
        const consumed = Math.min(Number(row.quantity), remaining);
        await tx.warehouseStock.update({
          where: { id: Number(row.id) },
          data: { quantity: Number(row.quantity) - consumed },
        });
        remaining -= consumed;
      }

      const movement = await tx.warehouseMovement.create({
        data: { ...expected, previous_stock: total, new_stock: total - line.quantity },
        include: movementInclude,
      });
      createdByKey.set(expected.idempotency_key, movement);
    }

    return expectedMovements.map((movement) => createdByKey.get(movement.idempotency_key));
  });
};

export const createBatchInWithStock = async ({
  items,
  ubicationId,
  departmentId,
  receiverName,
  reference,
  observation,
  createdBy,
  idempotencyKey,
}) => {
  const expectedMovements = items.map((line) => ({
    idempotency_key: buildWarehouseLineIdempotencyKey(idempotencyKey, line.itemId),
    item_id: line.itemId,
    quantity: line.quantity,
    movement_type: 'IN',
    ubication_id: ubicationId,
    department_id: departmentId,
    receiver_name: receiverName,
    reference: reference ?? null,
    observation: observation ?? null,
    created_by: createdBy,
  }));

  return createIdempotentMovements(expectedMovements, async (tx) => {
    const createdByKey = new Map();
    const lockOrder = [...expectedMovements].sort((first, second) => first.item_id - second.item_id);
    for (const expected of lockOrder) {
      const stock = await tx.warehouseStock.upsert({
        where: {
          item_id_ubication_id: { item_id: expected.item_id, ubication_id: ubicationId },
        },
        create: { item_id: expected.item_id, ubication_id: ubicationId, quantity: 0 },
        update: {},
      });
      const previousStock = Number(stock.quantity);
      const newStock = previousStock + expected.quantity;
      await tx.warehouseStock.update({
        where: { id: stock.id },
        data: { quantity: newStock },
      });
      createdByKey.set(
        expected.idempotency_key,
        await tx.warehouseMovement.create({
          data: { ...expected, previous_stock: previousStock, new_stock: newStock },
          include: movementInclude,
        })
      );
    }

    return expectedMovements.map((movement) => createdByKey.get(movement.idempotency_key));
  });
};
