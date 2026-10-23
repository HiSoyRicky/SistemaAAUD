import assert from 'node:assert/strict';
import test from 'node:test';
import { planItemClassification } from '../src/modules/inventory/classification-sync.service.js';

const rulesByDevice = new Map([
  [10, { id: 100, device_id: 10, administrative_area_id: 3 }],
  [11, { id: 101, device_id: 11, administrative_area_id: null }],
]);

test('planItemClassification asigna la regla del device y su área', () => {
  const item = {
    asset_classification_rule_id: null,
    id_administrative_area: 1,
    device_details: { id_device: 10 },
  };
  assert.deepEqual(planItemClassification(item, rulesByDevice), {
    asset_classification_rule_id: 100,
    id_administrative_area: 3,
  });
});

test('planItemClassification conserva el área cuando la regla no define área', () => {
  const item = {
    asset_classification_rule_id: null,
    id_administrative_area: 7,
    device_details: { id_device: 11 },
  };
  assert.deepEqual(planItemClassification(item, rulesByDevice), {
    asset_classification_rule_id: 101,
  });
});

test('planItemClassification quita la regla cuando el device ya no tiene regla activa', () => {
  const item = {
    asset_classification_rule_id: 55,
    id_administrative_area: 3,
    device_details: { id_device: 99 },
  };
  assert.deepEqual(planItemClassification(item, rulesByDevice), {
    asset_classification_rule_id: null,
  });
});

test('planItemClassification no cambia un bien sin device y sin regla', () => {
  const item = { asset_classification_rule_id: null, id_administrative_area: 2, device_details: null };
  assert.equal(planItemClassification(item, rulesByDevice), null);
});

test('planItemClassification no cambia un bien ya sincronizado', () => {
  const item = {
    asset_classification_rule_id: 100,
    id_administrative_area: 3,
    device_details: { id_device: 10 },
  };
  assert.equal(planItemClassification(item, rulesByDevice), null);
});
