import assert from 'node:assert/strict';
import test from 'node:test';
import { findMovementGroups, findMovements } from '../src/modules/warehouse/warehouse.repository.js';
import { buildMovementWhere } from '../src/modules/warehouse/warehouse.service.js';

test('normaliza filtros de fechas ISO en UTC y conserva los otros filtros', () => {
  const where = buildMovementWhere({
    item_id: '8',
    movement_type: 'out',
    from: '2026-09-01',
    to: '2026-09-30',
  });

  assert.equal(where.item_id, 8);
  assert.equal(where.movement_type, 'OUT');
  assert.equal(where.created_at.gte.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(where.created_at.lte.toISOString(), '2026-09-30T23:59:59.999Z');
});

test('rechaza fechas inválidas, formatos distintos e intervalos invertidos', () => {
  assert.throws(() => buildMovementWhere({ from: '2026-02-30' }), /no es válida/);
  assert.throws(() => buildMovementWhere({ from: '2026-09-01T00:00:00Z' }), /formato/);
  assert.throws(
    () => buildMovementWhere({ from: '2026-09-30', to: '2026-09-01' }),
    /no puede ser mayor/
  );
});

test('página movimientos con orden estable por fecha e ID descendentes', async () => {
  let query;
  await findMovements({
    where: { item_id: 8 },
    skip: 20,
    take: 10,
    db: {
      warehouseMovement: {
        findMany: async (args) => {
          query = args;
          return [];
        },
      },
    },
  });

  assert.deepEqual(query.where, { item_id: 8 });
  assert.equal(query.skip, 20);
  assert.equal(query.take, 10);
  assert.deepEqual(query.orderBy, [{ created_at: 'desc' }, { id: 'desc' }]);
});

test('recupera juntas las líneas de un despacho y conserva movimientos individuales', async () => {
  const key = '11111111-1111-4111-8111-111111111111';
  let query;
  const result = await findMovementGroups({
    where: { item_id: 1 }, skip: 0, take: 2,
    db: {
      $queryRaw: async () => [{ total: 2, group_key: `batch:${key}` }, { total: 2, group_key: 'movement:3' }],
      warehouseMovement: { findMany: async (args) => {
        query = args;
        return [
          { id: 2, idempotency_key: `${key}:2` },
          { id: 1, idempotency_key: `${key}:1` },
          { id: 3, idempotency_key: null },
        ];
      } },
    },
  });
  assert.equal(result.total, 2);
  assert.deepEqual(result.groups.map((group) => group.map((line) => line.id)), [[2, 1], [3]]);
  assert.deepEqual(query.where.OR, [
    { movement_type: 'OUT', idempotency_key: { startsWith: `${key}:` } },
    { id: 3 },
  ]);
});

test('página fuera de rango conserva el total sin buscar movimientos', async () => {
  const result = await findMovementGroups({
    where: {}, skip: 20, take: 10,
    db: { $queryRaw: async () => [{ total: 4, group_key: null }] },
  });
  assert.deepEqual(result, { total: 4, groups: [] });
});
