import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHistoryItem } from '../src/modules/inventory/services/inventory-history.service.js';

const maps = {
  ubicationsMap: new Map([[1, 'Sede central']]),
  departmentsMap: new Map([[2, 'Informática']]),
  statusMap: new Map([[3, 'Buen estado']]),
  devicesMap: new Map([[4, 'Laptop']]),
  brandsMap: new Map([[5, 'Dell']]),
  modelsMap: new Map([[6, 'Latitude']]),
  conditionsMap: new Map(),
  administrativeAreasMap: new Map(),
  classificationRulesMap: new Map([
    [
      7,
      {
        id: 7,
        classification: { code_new: '12040320', description: 'Equipo informático' },
        asset_type: { code: 'TECHNOLOGY', name: 'Tecnología' },
        extension: { code: 'DEVICES', name: 'Dispositivos' },
      },
    ],
  ]),
};

test('reconstruye un historial legacy sin extensión tecnológica', () => {
  const item = buildHistoryItem({
    log: { id: 1, entity_id: 10, action: 'UPDATE', created_at: '2026-08-21T10:00:00Z' },
    oldValues: { tag: 'A-10', user: 'Anterior', id_device: null, id_brand: null, id_model: null, ip: null },
    newValues: { tag: 'A-10', user: 'Actual', id_device: null, id_brand: null, id_model: null, ip: null },
    ...maps,
  });

  assert.equal(item.inventory_id, 10);
  assert.equal(item.previous_user, 'Anterior');
  assert.equal(item.new_user, 'Actual');
  assert.equal(item.device_name, null);
  assert.equal(item.previous_classification_rule, null);
});

test('reconstruye clasificación y extensión tecnológica', () => {
  const item = buildHistoryItem({
    log: { id: 2, entity_id: 11, action: 'UPDATE', created_at: '2026-08-21T10:00:00Z' },
    oldValues: { asset_classification_rule_id: 7, id_device: 4, id_brand: 5, id_model: 6 },
    newValues: { asset_classification_rule_id: 7, id_device: 4, id_brand: 5, id_model: 6 },
    ...maps,
  });

  assert.equal(item.new_classification_rule.classification.code_new, '12040320');
  assert.equal(item.new_device, 'Laptop');
  assert.equal(item.new_brand, 'Dell');
  assert.equal(item.new_model, 'Latitude');
});

test('tolera un activo sin inventory_devices en el estado actual', () => {
  const item = buildHistoryItem({
    log: { id: 3, entity_id: 12, action: 'CREATE', created_at: '2026-08-21T10:00:00Z' },
    oldValues: {},
    newValues: { tag: 'A-12', description: 'Activo general' },
    ...maps,
  });

  assert.equal(item.device_name, null);
  assert.equal(item.brand_name, null);
  assert.equal(item.model_name, null);
  assert.equal(item.previous_ip, null);
  assert.equal(item.new_ip, null);
});