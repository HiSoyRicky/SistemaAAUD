import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildInventorySearchWhere,
  collectInventoryAssetTypeIds,
  findPage,
  getInventoryPage,
  sortInventoryRows,
} from '../src/modules/inventory/inventory.repository.js';

test('carga los detalles solo de la página, conservando el orden natural y el alcance', async () => {
  const rows = [
    { id: 3, tag: 'AA-10' },
    { id: 2, tag: 'AA-2', asset_classification_rule: null },
    { id: 4, tag: 'AA-2', asset_classification_rule: { classification: { id: 1 } } },
    { id: 1, tag: 'AA-1' },
  ];
  const queries = [];
  const db = { inventory_items: { findMany: async (query) => {
    queries.push(query);
    return query.select ? [...rows] : [{ id: 2 }, { id: 4 }];
  } } };
  const client = { $transaction: (callback) => callback(db) };
  const result = await findPage({ search: '', filters: {}, scope: { technologyOnly: true }, skip: 1, take: 2 }, client);
  assert.deepEqual(result.data.map((item) => item.id), [4, 2]);
  assert.equal(result.total, 4);
  assert.deepEqual(queries[1].where.AND[1].id.in, [4, 2]);
  assert.deepEqual(queries[1].where.AND[0], queries[0].where);
  assert.ok(queries[0].select.asset_classification_rule.select.classification);
});

test('paginación local preserva orden, no duplica y no omite filas entre páginas', () => {
  const rows = [
    { id: 3, tag: 'AA-10' },
    { id: 2, tag: 'AA-2', asset_classification_rule: { classification: { id: 5 } } },
    { id: 4, tag: 'AA-2' },
    { id: 1, tag: 'AA-1' },
  ];
  const expectedIds = sortInventoryRows([...rows]).map((row) => row.id);
  const pageIds = [
    ...getInventoryPage([...rows], 0, 2).map((row) => row.id),
    ...getInventoryPage([...rows], 2, 2).map((row) => row.id),
  ];

  assert.deepEqual(pageIds, expectedIds);
  assert.equal(new Set(pageIds).size, rows.length);
  assert.deepEqual(expectedIds, [1, 2, 4, 3]);
});

test('el filtro por tipo busca tanto el tipo directo como el de la regla', () => {
  const where = buildInventorySearchWhere('', { asset_type: 'Mobiliario', status: 'Activo' });
  const typeCondition = where.AND.find((condition) => condition.OR);

  assert.ok(typeCondition.OR.some((condition) =>
    condition.AND?.some((branch) => branch.asset_classification_rule_id === null) &&
    condition.AND?.some((branch) => branch.asset_type?.is?.name?.equals === 'Mobiliario')));
  assert.ok(typeCondition.OR.some((condition) => condition.asset_classification_rule));
  assert.ok(where.AND.some((condition) => condition.status));
});

test('las opciones de tipo incluyen bienes con y sin regla y eliminan IDs repetidos', () => {
  const ids = collectInventoryAssetTypeIds([
    { asset_type_id: 3, asset_classification_rule: null },
    { asset_type_id: null, asset_classification_rule: { asset_type_id: 4 } },
    { asset_type_id: 9, asset_classification_rule: { asset_type_id: 4 } },
    { asset_type_id: 4, asset_classification_rule: null },
    { asset_type_id: null, asset_classification_rule: null },
  ]);

  assert.deepEqual(ids, [3, 4]);
});
