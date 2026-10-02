import assert from 'node:assert/strict';
import test from 'node:test';
import { findMovements } from '../src/modules/warehouse/warehouse.repository.js';
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