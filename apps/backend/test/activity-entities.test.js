import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFilters } from '../src/modules/activity/activity.service.js';

test('el filtro de almacén incluye el nombre real de Prisma y su variante normalizada', () => {
  assert.deepEqual(buildFilters({ entityType: 'WAREHOUSEMOVEMENT' }).entityTypes, [
    'WarehouseMovement', 'WAREHOUSEMOVEMENT',
  ]);
});

test('el filtro de clasificación incluye nombres actuales e históricos', () => {
  assert.deepEqual(buildFilters({ entityType: 'inventory_asset_classification_rules' }).entityTypes, [
    'INVENTORY_ASSET_CLASSIFICATION_RULES', 'inventory_asset_classification_rules',
  ]);
});
