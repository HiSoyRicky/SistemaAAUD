import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPreviewInventory } from '../src/modules/inventoryTransferRequests/inventoryTransferRequests.service.js';

const baseInventory = {
  id: 7,
  tag: 'AAUD-007',
  serie: 'S/S',
  user: 'Responsable',
  id_device: 2,
  id_brand: 3,
  id_model: 4,
  ip: null,
  id_status: 5,
  status: { name: 'BUEN ESTADO' },
  ubications: { name: 'Origen' },
  departments: { name: 'Departamento' },
  administrative_area: { id: 1, name: 'TECNOLOGÍA' },
  id_administrative_area: 1,
  inventory_devices: null,
};

test('construye preview general sin extensión tecnológica', () => {
  const snapshot = { ubication_destino_name: 'Destino' };
  const originalSnapshot = structuredClone(snapshot);
  const preview = buildPreviewInventory(
    { snapshot },
    baseInventory
  );

  assert.equal(preview.tag, 'AAUD-007');
  assert.equal(preview.ubication_name, 'Destino');
  assert.equal(preview.extension, null);
  assert.equal(preview.device_name, null);
  assert.deepEqual(snapshot, originalSnapshot);
});

test('conserva clasificación y tecnología opcional en preview', () => {
  const preview = buildPreviewInventory(
    { snapshot: {} },
    {
      ...baseInventory,
      asset_classification_rule: {
        id: 4,
        active: true,
        is_default: true,
        classification: { id: 8, code_new: '12040320', description: 'Equipo informático' },
        asset_type: { id: 9, code: 'TECHNOLOGY', name: 'Tecnología' },
        extension: { id: 10, code: 'DEVICES', name: 'Dispositivos' },
      },
      inventory_devices: {
        id: 11,
        id_inventory: 7,
        id_device: 20,
        id_brand: 30,
        id_model: 40,
        ip: '10.0.0.7',
        device: { id: 20, name: 'Laptop' },
        brand: { id: 30, name: 'Dell' },
        model: { id: 40, name: 'Latitude' },
      },
    }
  );

  assert.equal(preview.classification.code_new, '12040320');
  assert.equal(preview.asset_type.code, 'TECHNOLOGY');
  assert.equal(preview.extension.type, 'DEVICES');
  assert.equal(preview.device_name, 'Laptop');
  assert.equal(preview.ip, '10.0.0.7');
});

test('transfiere el área administradora de forma independiente del tenedor', () => {
  const preview = buildPreviewInventory(
    {
      snapshot: {
        administrative_area_destino_id: 2,
        administrative_area_destino_name: 'BIENES PATRIMONIALES',
        userRecibe: 'Pedro Pérez',
      },
    },
    baseInventory
  );

  assert.equal(preview.id_administrative_area, 2);
  assert.equal(preview.user, 'Pedro Pérez');
  assert.equal(preview.administrative_area_name, 'BIENES PATRIMONIALES');
});