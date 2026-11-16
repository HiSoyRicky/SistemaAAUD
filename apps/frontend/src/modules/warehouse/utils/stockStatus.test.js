import test from 'node:test';
import assert from 'node:assert/strict';
import { stockStatus } from './stockStatus.js';

test('distingue agotado, mínimo inclusive y stock disponible', () => {
  assert.equal(stockStatus(0, 5).label, 'Agotado');
  assert.equal(stockStatus(4, 5).label, 'Stock bajo');
  assert.equal(stockStatus(5, 5).label, 'Stock bajo');
  assert.equal(stockStatus(6, 5).label, 'Disponible');
});
