import assert from 'node:assert/strict';
import test from 'node:test';
import { mapInventoryItem } from '../src/modules/inventory/inventory.dto.js';

const baseInventory = {
  id: 1,
  tag: 'AAUD-001',
  serie: 'SERIE-001',
  id_device: 2,
  id_brand: 3,
  id_model: 4,
  ip: '192.168.1.10',
  id_status: 5,
  status: { name: 'BUEN ESTADO' },
};

test('expone clasificación y conserva campos tecnológicos', () => {
  const item = mapInventoryItem({
    ...baseInventory,
    asset_classification_rule: {
      id: 7,
      active: true,
      is_default: true,
      classification: {
        id: 8,
        code_new: '12040320',
        description: 'Equipo informático',
        parent_id: 3,
        level: 3,
        is_assignable: true,
      },
      asset_type: { id: 9, code: 'TECHNOLOGY', name: 'Tecnología' },
      extension: { id: 10, code: 'DEVICES', name: 'Dispositivos' },
    },
    inventory_devices: {
      id: 50,
      id_inventory: 1,
      id_device: 20,
      id_brand: 30,
      id_model: 40,
      ip: '10.0.0.20',
      device: { name: 'Laptop' },
      brand: { name: 'Dell' },
      model: { name: 'Latitude' },
    },
  });

  assert.equal(item.classification_rule.classification.code_new, '12040320');
  assert.equal(item.classification_rule.asset_type.code, 'TECHNOLOGY');
  assert.equal(item.classification_rule.extension.code, 'DEVICES');
  assert.equal(item.classification.code_new, '12040320');
  assert.equal(item.asset_type.code, 'TECHNOLOGY');
  assert.equal(item.extension.type, 'DEVICES');
  assert.equal(item.extension.devices.id_inventory, 1);
  assert.equal(item.extension.vehicles, null);
  assert.equal(item.extension.properties, null);
  assert.equal(item.technology.device.name, 'Laptop');
  assert.equal(item.technology.brand.name, 'Dell');
  assert.equal(item.technology.model.name, 'Latitude');
  assert.equal(item.technology.ip, '10.0.0.20');
  assert.equal(item.id_device, 20);
  assert.equal(item.id_brand, 30);
  assert.equal(item.id_model, 40);
  assert.equal(item.ip, '10.0.0.20');
  assert.equal(item.device_name, 'Laptop');
});

test('permite DTO legacy sin regla ni inventory_devices', () => {
  const item = mapInventoryItem({
    ...baseInventory,
    asset_classification_rule: null,
    inventory_devices: null,
  });

  assert.equal(item.classification_rule, null);
  assert.equal(item.classification, null);
  assert.equal(item.asset_type, null);
  assert.equal(item.extension, null);
  assert.equal(item.technology, null);
  assert.equal(item.id_device, 2);
  assert.equal(item.id_brand, 3);
  assert.equal(item.id_model, 4);
  assert.equal(item.ip, '192.168.1.10');
  assert.equal(item.device_name, null);
});

test('representa clasificación sin extensión sin romper el DTO', () => {
  const item = mapInventoryItem({
    ...baseInventory,
    asset_classification_rule: {
      id: 11,
      active: true,
      is_default: true,
      classification: {
        id: 12,
        code_new: '120403',
        description: 'Maquinaria, equipos y otros',
        parent_id: 1,
        level: 2,
        is_assignable: true,
      },
      asset_type: { id: 13, code: 'OTHER', name: 'Otro' },
      extension: null,
    },
    inventory_devices: null,
  });

  assert.equal(item.classification.code_new, '120403');
  assert.equal(item.asset_type.code, 'OTHER');
  assert.equal(item.extension.type, null);
  assert.equal(item.extension.extension, null);
  assert.equal(item.extension.devices, null);
  assert.equal(item.technology, null);
});
