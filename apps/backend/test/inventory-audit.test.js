import assert from 'node:assert/strict';
import test from 'node:test';
import { activityContext } from '../src/common/services/activityLogger.js';
import {
  sameInventoryAuditState,
  toInventoryAuditSnapshot,
  writeInventoryAuditEvent,
} from '../src/modules/inventory/services/inventory-audit.service.js';

const inventoryRecord = {
  id: 21,
  tag: 'AAUD-021',
  user: 'Responsable',
  id_device: 1,
  id_brand: 2,
  id_model: 3,
  ip: '10.0.0.21',
  password: 'must not be audited',
  inventory_devices: {
    id_device: 4,
    id_brand: 5,
    id_model: 6,
    ip: '10.0.0.22',
  },
};

test('crea snapshots allowlisted con la tecnología vigente de la extensión', () => {
  const snapshot = toInventoryAuditSnapshot(inventoryRecord);

  assert.equal(snapshot.id, 21);
  assert.equal(snapshot.id_device, 4);
  assert.equal(snapshot.id_brand, 5);
  assert.equal(snapshot.id_model, 6);
  assert.equal(snapshot.ip, '10.0.0.22');
  assert.equal(Object.hasOwn(snapshot, 'password'), false);
});

test('normaliza fechas Prisma a JSON antes de persistir snapshots', () => {
  const snapshot = toInventoryAuditSnapshot({
    id: 22,
    transferdate: new Date('2026-09-30T00:00:00.000Z'),
  });

  assert.equal(snapshot.transferdate, '2026-09-30T00:00:00.000Z');
});

test('escribe un evento lógico con actor confiable y propaga fallos de auditoría', async () => {
  let event;
  const tx = {
    activity_logs: {
      create: async ({ data }) => {
        event = data;
        return data;
      },
    },
  };

  await activityContext.run({ userId: 99, ipAddress: '127.0.0.1', userAgent: 'test' }, () =>
    writeInventoryAuditEvent(tx, {
      action: 'UPDATE',
      oldRecord: { id: 21, tag: 'AAUD-021' },
      newRecord: inventoryRecord,
      userId: 99,
      source: 'inventory.update',
    })
  );

  assert.equal(event.entity_type, 'BD_INVENTORY');
  assert.equal(event.entity_id, 21);
  assert.equal(event.user_id, 99);
  assert.equal(event.ip_address, '127.0.0.1');
  assert.equal(event.source, 'inventory.update');
  assert.equal(event.old_values.tag, 'AAUD-021');
  assert.equal(event.new_values.ip, '10.0.0.22');

  const auditFailure = new Error('audit insert failed');
  await assert.rejects(
    writeInventoryAuditEvent(
      { activity_logs: { create: async () => { throw auditFailure; } } },
      { action: 'CREATE', newRecord: inventoryRecord, userId: 99, source: 'inventory.create' }
    ),
    auditFailure
  );
});

test('compara solo el estado de negocio y detecta cambios tecnológicos', () => {
  assert.equal(sameInventoryAuditState(inventoryRecord, structuredClone(inventoryRecord)), true);
  assert.equal(
    sameInventoryAuditState(inventoryRecord, {
      ...inventoryRecord,
      inventory_devices: { ...inventoryRecord.inventory_devices, ip: '10.0.0.23' },
    }),
    false
  );
});