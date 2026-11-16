import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../src/modules/warehouse/warehouse.routes.js';
import { findStockAlerts } from '../src/modules/warehouse/warehouse.repository.js';

test('alertas consideran el stock total de insumos activos, incluso sin movimientos', async () => {
  let query;
  const result = await findStockAlerts({
    $queryRaw: async (strings) => {
      query = strings.join('');
      return [{ id: 5, code: 'A', name: 'Papel', unit: 'RES', min_stock: 5, quantity: 4n }];
    },
  });
  assert.match(query, /LEFT JOIN warehouse_stock/);
  assert.match(query, /WHERE i\.active = true/);
  assert.match(query, /HAVING COALESCE\(SUM\(s\.quantity\), 0\) <= i\.min_stock/);
  assert.deepEqual(result, [{ item: { id: 5, code: 'A', name: 'Papel', unit: 'RES', min_stock: 5 }, quantity: 4 }]);
});

test('alertas requieren permiso de lectura de stock', async () => {
  const route = router.stack.find((layer) => layer.route?.path === '/stock/alerts').route;
  const authorize = route.stack[0].handle;
  for (const [permissions, allowed] of [[[], false], [['warehouse_stock.read'], true]]) {
    let status;
    let nextCalled = false;
    const res = { status(value) { status = value; return this; }, json() {} };
    await authorize({ user: { id: 1, permissionsLoaded: true, permissions } }, res, () => { nextCalled = true; });
    assert.equal(nextCalled, allowed);
    if (!allowed) assert.equal(status, 403);
  }
});
