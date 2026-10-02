import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildInventoryMovementFilters,
  buildInventoryMovementPageQuery,
  getInventoryMovementPageMetadata,
} from '../src/modules/inventory/inventory.repository.js';
import { parsePagination } from '../src/modules/inventory/utils/inventory.parsers.js';

test('construye filtros SQL parametrizados para activo, acción, fechas y actor', () => {
  const filters = buildInventoryMovementFilters({
    inventoryId: 41,
    action: 'UPDATE',
    from: new Date('2026-09-01T00:00:00.000Z'),
    to: new Date('2026-09-30T23:59:59.999Z'),
    actor: 'Ana Pérez',
  });

  assert.match(filters.base.sql, /entity_type IN/);
  assert.match(filters.base.sql, /entity_id =/);
  assert.match(filters.base.sql, /ActivityAction/);
  assert.match(filters.base.sql, /created_at >=/);
  assert.match(filters.base.sql, /created_at <=/);
  assert.match(filters.base.sql, /nombre_completo ILIKE/);
  assert.ok(filters.base.values.includes(41));
  assert.ok(filters.base.values.includes('UPDATE'));
  assert.ok(filters.base.values.includes('%Ana Pérez%'));
  assert.match(filters.searchScoped.sql, /TRUE/);
});

test('la búsqueda escapa comodines y aplica el mismo filtro al conteo y a la página', () => {
  const filters = buildInventoryMovementFilters({ search: 'AA_%' });

  assert.match(filters.searchScoped.sql, /old_values::text/);
  assert.match(filters.searchCount.sql, /new_values::text/);
  assert.ok(filters.searchScoped.values.includes('%AA\\_\\%%'));
  assert.ok(filters.searchCount.values.includes('%AA\\_\\%%'));
});

test('página SQL usa LEAD en orden descendente para obtener el movimiento anterior', () => {
  const filters = buildInventoryMovementFilters({ inventoryId: 8 });
  const query = buildInventoryMovementPageQuery(filters, 25, 50);

  assert.match(query.sql, /LEAD\(al\.created_at\)/);
  assert.match(query.sql, /ORDER BY al\.created_at DESC, al\.id DESC/);
  assert.match(query.sql, /ORDER BY created_at DESC, id DESC/);
  assert.match(query.sql, /LIMIT \? OFFSET \?/);
  assert.equal(query.values.at(-2), 25);
  assert.equal(query.values.at(-1), 50);
});

test('valida el máximo de página y calcula metadatos con el total filtrado', () => {
  assert.deepEqual(parsePagination({ page: '3', limit: '500' }), {
    page: 3,
    limit: 200,
  });
  assert.deepEqual(getInventoryMovementPageMetadata(8, 10, 25), {
    page: 3,
    totalPages: 3,
  });
  assert.deepEqual(getInventoryMovementPageMetadata(4, 10, 0), {
    page: 1,
    totalPages: 1,
  });
});