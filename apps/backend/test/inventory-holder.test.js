import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInventoryBodySchema,
  updateInventoryBodySchema,
} from '../src/modules/inventory/inventory.validator.js';
import { buildHistoryItem } from '../src/modules/inventory/services/inventory-history.service.js';

const baseCreatePayload = {
  tag: 'A-100',
  serie: 'S-100',
  id_status: 1,
};

test('acepta persona tenedora como texto libre sin cuenta de sistema', () => {
  const result = createInventoryBodySchema.safeParse({
    ...baseCreatePayload,
    user: 'Juan Pérez',
  });

  assert.equal(result.success, true);
});

test('permite desasignar la persona tenedora con null', () => {
  const result = updateInventoryBodySchema.safeParse({ user: null });

  assert.equal(result.success, true);
});

test('rechaza IDs numéricos para persona tenedora', () => {
  const result = updateInventoryBodySchema.safeParse({ user: 42 });

  assert.equal(result.success, false);
});

test('conserva el cambio y la desasignación de persona tenedora en historial', () => {
  const item = buildHistoryItem({
    log: { id: 100, entity_id: 20, action: 'UPDATE', created_at: '2026-08-21T10:00:00Z' },
    oldValues: { tag: 'A-100', user: 'Juan Pérez' },
    newValues: { tag: 'A-100', user: null },
    ubicationsMap: new Map(),
    departmentsMap: new Map(),
    statusMap: new Map(),
    devicesMap: new Map(),
    brandsMap: new Map(),
    modelsMap: new Map(),
    conditionsMap: new Map(),
    administrativeAreasMap: new Map(),
    classificationRulesMap: new Map(),
  });

  assert.equal(item.previous_user, 'Juan Pérez');
  assert.equal(item.new_user, null);
  assert.deepEqual(item.changed_fields, [
    { field: 'Persona tenedora', from: 'Juan Pérez', to: null },
  ]);
});