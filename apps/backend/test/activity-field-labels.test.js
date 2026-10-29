import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFieldChange } from '../src/modules/activity/activity.resolver.js';

test('los cambios de clasificación muestran nombres y conservan los ID desconocidos', () => {
  const tables = { classification_id: { 9: '12040302 · Vehículos' }, device_id: { 10: 'Torre' } };
  assert.deepEqual(buildFieldChange(tables, 'classification_id', null, 9, 'CREATE'), {
    field: 'Clasificación patrimonial', from: '—', to: '12040302 · Vehículos',
  });
  assert.deepEqual(buildFieldChange(tables, 'device_id', 10, null, 'UPDATE'), {
    field: 'Bien', from: 'Torre', to: '—',
  });
  assert.equal(buildFieldChange(tables, 'device_id', null, 99, 'UPDATE').to, 'ID:99');
});

test('los campos de vehículos y reglas se presentan en español', () => {
  for (const [key, label] of [['fuel_type', 'Combustible'], ['vehicle_type', 'Tipo de vehículo'], ['model_year', 'Año del modelo'], ['is_default', 'Regla predeterminada'], ['asset_type_id', 'Tipo de activo'], ['extension_id', 'Extensión del activo'], ['administrative_area_id', 'Área administradora']]) {
    assert.equal(buildFieldChange({}, key, null, 1, 'CREATE').field, label);
  }
});
