import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryRecordLabel } from '../src/modules/activity/activity.resolver.js';

test('la etiqueta del activo usa la instantánea del evento y conserva campos anteriores', () => {
  const tables = { id_device: { 1: 'UPS' }, id_brand: { 2: 'Forza' }, id_model: { 3: 'NT-751' } };
  assert.equal(
    inventoryRecordLabel(tables,
      { tag: '014361', serie: '260522508552', id_device: 1, id_brand: 2, id_model: 3 },
      { user: 'Alexis Roger' }),
    '014361 · Serie 260522508552 · Asignado a Alexis Roger · UPS · Forza · NT-751'
  );
  assert.equal(inventoryRecordLabel(tables, null, { id_device: 1 }), null);
});
