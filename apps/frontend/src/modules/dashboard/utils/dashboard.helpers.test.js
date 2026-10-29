import test from 'node:test';
import assert from 'node:assert/strict';
import { incidentDepartmentSummary } from './dashboard.helpers.js';

test('cuenta departamentos distintos y meses en hora de Panamá con filtros', () => {
  const rows = [
    { id_department: 1, department_name: 'Compras', department_ubication_name: 'Sede A', ubication_name: 'Otra sede', creation_date: '2026-03-01T03:00:00Z' },
    { id_department: 1, department_name: 'Compras', department_ubication_name: 'Sede A', creation_date: '2026-03-10T12:00:00Z' },
    { id_department: 2, department_name: 'Compras', department_ubication_name: 'Sede B', creation_date: '2025-12-15T12:00:00Z' },
    { id_department: 1, department_name: 'Compras', department_ubication_name: 'Sede A', creation_date: null },
  ];
  const all = incidentDepartmentSummary(rows);
  assert.deepEqual(all.years, ['2026', '2025']);
  assert.deepEqual(all.departments.map(({ key, count }) => [key, count]), [['id:1', 3], ['id:2', 1]]);
  assert.deepEqual(all.departments.map(({ label }) => label), ['Compras · Sede A', 'Compras · Sede B']);
  assert.equal(all.undated, 1);
  const selected = incidentDepartmentSummary(rows, '2026', 'id:1');
  assert.equal(selected.departments[0].label, 'Compras');
  assert.deepEqual(selected.monthly, [{ month: '2026-03', count: 1 }, { month: '2026-02', count: 1 }]);
  assert.equal(selected.undated, 0);
  assert.deepEqual(incidentDepartmentSummary(rows, '2025', 'id:2').monthly, [{ month: '2025-12', count: 1 }]);
});

test('distingue departamentos homónimos con ubicación igual o ausente', () => {
  const summary = incidentDepartmentSummary([
    { id_department: 1, department_name: 'Compras' },
    { id_department: 2, department_name: 'Compras' },
  ]);
  assert.deepEqual(summary.departments.map(({ label }) => label), ['Compras · Ubicación sin registrar', 'Compras · Ubicación sin registrar']);
  assert.notEqual(summary.departments[0].key, summary.departments[1].key);
});
