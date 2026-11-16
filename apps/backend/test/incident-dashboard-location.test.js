import test from 'node:test';
import assert from 'node:assert/strict';
import { mapIncidentListItem } from '../src/modules/incidents/incidents.dto.js';

test('la ubicación del departamento procede de su relación, no de la incidencia', () => {
  const incident = mapIncidentListItem({
    id: 1, id_department: 8,
    departments: { name: 'Compras', ubications: { name: 'Sede A' } },
    ubications: { name: 'Sede B' },
  });
  assert.equal(incident.department_ubication_name, 'Sede A');
  assert.equal(incident.ubication_name, 'Sede B');
  assert.equal(incident.id_department, 8);
});
