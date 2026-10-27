import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIncidentSearchWhere, findPage } from '../src/modules/incidents/incidents.repository.js';

test('busca incidencias por nombre, ubicación, categoría y estado', () => {
  const where = buildIncidentSearchWhere('resuel');
  assert.ok(where.OR.some((term) => term.reporter_name?.contains === 'resuel'));
  assert.ok(where.OR.some((term) => term.categories?.is?.name?.contains === 'resuel'));
  assert.ok(where.OR.some((term) => term.id_status?.in?.includes(3)));
  assert.deepEqual(buildIncidentSearchWhere('  '), {});
});

test('paginación y métricas conservan el alcance de técnico', async () => {
  let listArgs, countArgs, metricArgs;
  const db = { bd_incidents: {
    findMany: async (args) => { listArgs = args; return []; },
    count: async (args) => { countArgs = args; return 0; },
    groupBy: async (args) => { metricArgs = args; return []; },
  } };
  await findPage({ technicianId: 42, search: 'papel', skip: 25, take: 25, db });
  assert.equal(listArgs.where.id_technician, 42);
  assert.equal(countArgs.where.id_technician, 42);
  assert.equal(metricArgs.where.id_technician, 42);
  assert.equal(listArgs.skip, 25);
  assert.equal(listArgs.take, 25);
  assert.deepEqual(listArgs.orderBy, [{ id_status: 'asc' }, { id: 'desc' }]);
});
