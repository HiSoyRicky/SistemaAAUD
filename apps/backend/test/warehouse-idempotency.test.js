import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWarehouseLineIdempotencyKey,
  resolveExistingIdempotentMovements,
} from '../src/modules/warehouse/warehouse.repository.js';
import {
  parseBatchMovementMetadata,
  parseIdempotencyKey,
} from '../src/modules/warehouse/warehouse.service.js';

const operationKey = '550e8400-e29b-41d4-a716-446655440000';

function movement(idempotencyKey, itemId, quantity) {
  return {
    idempotency_key: idempotencyKey,
    item_id: itemId,
    quantity,
    movement_type: 'OUT',
    ubication_id: 5,
    department_id: 6,
    receiver_name: 'Persona receptora',
    reference: null,
    observation: null,
    created_by: 7,
    id: itemId + 100,
  };
}

test('normaliza UUID y rechaza claves que no sean UUID', () => {
  assert.equal(parseIdempotencyKey(operationKey.toUpperCase()), operationKey);
  assert.throws(() => parseIdempotencyKey('retry-1'), /Clave de operación inválida/);
});

test('deriva claves de línea distintas y estables por insumo', () => {
  assert.equal(buildWarehouseLineIdempotencyKey(operationKey, 12), `${operationKey}:12`);
  assert.notEqual(
    buildWarehouseLineIdempotencyKey(operationKey, 12),
    buildWarehouseLineIdempotencyKey(operationKey, 13)
  );
});

test('un reintento idéntico devuelve las filas existentes en el orden solicitado', () => {
  const first = movement(buildWarehouseLineIdempotencyKey(operationKey, 12), 12, 3);
  const second = movement(buildWarehouseLineIdempotencyKey(operationKey, 13), 13, 4);

  const resolved = resolveExistingIdempotentMovements([second, first], [first, second]);

  assert.deepEqual(resolved, [first, second]);
});

test('rechaza claves reutilizadas con payload diferente o incompleto', () => {
  const first = movement(buildWarehouseLineIdempotencyKey(operationKey, 12), 12, 3);
  const second = movement(buildWarehouseLineIdempotencyKey(operationKey, 13), 13, 4);

  assert.throws(
    () => resolveExistingIdempotentMovements([first], [first, second]),
    /clave de operación ya fue usada/
  );
  assert.throws(
    () => resolveExistingIdempotentMovements([first], [{ ...first, quantity: 9 }]),
    /datos diferentes/
  );
});

test('normaliza metadata batch opcional y respeta los tamaños de las columnas', () => {
  assert.deepEqual(
    parseBatchMovementMetadata({ reference: '  OC-123  ', observation: '  Entrega parcial  ' }),
    { reference: 'OC-123', observation: 'Entrega parcial' }
  );
  assert.deepEqual(parseBatchMovementMetadata({}), { reference: null, observation: null });
  assert.throws(() => parseBatchMovementMetadata({ reference: 'x'.repeat(121) }), /120 caracteres/);
  assert.throws(() => parseBatchMovementMetadata({ observation: 'x'.repeat(256) }), /255 caracteres/);
});