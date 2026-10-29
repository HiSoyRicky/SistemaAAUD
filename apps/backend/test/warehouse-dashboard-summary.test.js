import test from 'node:test';
import assert from 'node:assert/strict';
import { getStockSummary } from '../src/modules/warehouse/warehouse.repository.js';

test('resumen de almacén cuenta insumos registrados y disponibles', async (t) => {
  const count = t.mock.fn(async ({ where }) =>
    where.stock.some.quantity ? 4 : 7
  );
  assert.deepEqual(await getStockSummary({ warehouseItem: { count } }), { items: 7, availableItems: 4 });
  assert.deepEqual(count.mock.calls[1].arguments[0], { where: { stock: { some: { quantity: { gt: 0 } } } } });
});
