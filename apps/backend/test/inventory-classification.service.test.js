import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isTechnologyRule,
  resolveClassificationRule,
  validateClassificationRule,
  validateExtensionCompatibility,
} from '../src/modules/inventory/services/inventory-classification.service.js';
import { getClassificationRules } from '../src/modules/inventory/inventory.service.js';
import { getCatalogs } from '../src/modules/inventory/classification-rules.service.js';
import * as inventoryRepository from '../src/modules/inventory/inventory.repository.js';
import { resolveInventoryPagination } from '../src/modules/inventory/inventory.service.js';

const baseRule = {
  id: 1,
  active: true,
  extension_id: 10,
  classification: { active: true, is_assignable: true },
  asset_type: { active: true },
  extension: { id: 10, active: true },
};

test('rechaza una regla inexistente', () => {
  assert.throws(() => validateClassificationRule(null), /no existe/);
});

test('rechaza una regla inactiva', () => {
  assert.throws(
    () => validateClassificationRule({ ...baseRule, active: false }),
    /está inactiva/
  );
});

test('rechaza una clasificación inactiva', () => {
  assert.throws(
    () => validateClassificationRule({ ...baseRule, classification: { active: false, is_assignable: true } }),
    /clasificación patrimonial está inactiva/
  );
});

test('rechaza una clasificación no asignable', () => {
  assert.throws(
    () => validateClassificationRule({ ...baseRule, classification: { active: true, is_assignable: false } }),
    /no es asignable/
  );
});

test('rechaza un tipo general inactivo', () => {
  assert.throws(
    () => validateClassificationRule({ ...baseRule, asset_type: { active: false } }),
    /tipo general de activo está inactivo/
  );
});

test('rechaza una extensión inactiva', () => {
  assert.throws(
    () => validateClassificationRule({ ...baseRule, extension: { id: 10, active: false } }),
    /extensión técnica está inactiva/
  );
});

test('lista solo reglas activas con metadata derivada', async () => {
  const rules = await getClassificationRules({
    findActiveRules: async () => [
      {
        id: 1,
        active: true,
        is_default: true,
        classification: { id: 10, code_new: '12040320', description: 'Equipo informático', active: true, is_assignable: true },
        asset_type: { id: 4, code: 'TECHNOLOGY', name: 'Tecnología', active: true },
        extension: { id: 2, code: 'DEVICES', name: 'Dispositivos', active: true },
        administrative_area: { id: 7, name: 'TECNOLOGÍA' },
      },
      {
        id: 2,
        active: false,
        is_default: false,
        classification: { id: 11, code_new: '12040101', description: 'Urbanizados', active: true, is_assignable: true },
        asset_type: { id: 1, code: 'PROPERTY', name: 'Bienes Patrimoniales', active: true },
        extension: null,
        administrative_area: { id: 8, name: 'BIENES PATRIMONIALES' },
      },
    ],
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0].id, 1);
  assert.equal(rules[0].classification.description, 'Equipo informático');
  assert.equal(rules[0].asset_type.name, 'Tecnología');
  assert.equal(rules[0].extension.name, 'Dispositivos');
  assert.equal(rules[0].administrative_area.name, 'TECNOLOGÍA');
  assert.equal(rules[0].label, '12040320 — Equipo informático');
});

test('obtiene catálogos independientes de las reglas', async () => {
  const catalogs = await getCatalogs({
    findAssetTypes: async () => [{ id: 1, code: 'UNUSED', active: true }],
    findAssetExtensions: async () => [{ id: 2, code: 'NEW_EXTENSION', active: true }],
    findAdministrativeAreas: async () => [{ id: 3, name: 'Área sin reglas' }],
    findClassifications: async () => [{ id: 4, code_new: '12049999', active: true, is_assignable: true }],
  });

  assert.equal(catalogs.assetTypes[0].code, 'UNUSED');
  assert.equal(catalogs.extensions[0].code, 'NEW_EXTENSION');
  assert.equal(catalogs.administrativeAreas[0].name, 'Área sin reglas');
  assert.equal(catalogs.classifications[0].code_new, '12049999');
});

test('withTransaction existe y acepta un callback transaccional', () => {
  assert.equal(typeof inventoryRepository.withTransaction, 'function');
});

test('acepta una regla válida', () => {
  assert.equal(validateClassificationRule(baseRule), baseRule);
});

test('acepta una regla con extensión compatible', () => {
  assert.equal(validateExtensionCompatibility({ rule: baseRule, extensionId: 10 }), baseRule);
});

test('acepta una regla sin extensión cuando no se solicita extensión', () => {
  const rule = { ...baseRule, extension_id: null, extension: null };
  assert.equal(validateExtensionCompatibility({ rule }), rule);
});

test('rechaza una extensión incompatible', () => {
  assert.throws(
    () => validateExtensionCompatibility({ rule: baseRule, extensionId: 11 }),
    /no es compatible/
  );
});

test('resuelve reglas por precedencia de device, área y fallback genérico', async () => {
  const calls = [];
  const rules = new Map([
    ['device-area', { ...baseRule, id: 1 }],
    ['device-global', { ...baseRule, id: 2 }],
    ['generic-area', { ...baseRule, id: 3 }],
    ['generic-default', { ...baseRule, id: 4 }],
  ]);

  const findActiveByScope = async (scope) => {
    const key = scope.deviceId !== null
      ? scope.administrativeAreaId === null ? 'device-global' : 'device-area'
      : scope.administrativeAreaId === null ? 'generic-default' : 'generic-area';
    calls.push(key);
    return rules.get(key);
  };

  const result = await resolveClassificationRule(
    { deviceId: 28, assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    { findActiveByScope }
  );

  assert.equal(result.id, 1);
  assert.deepEqual(calls, ['device-area']);
});

test('usa el fallback genérico default cuando no existe regla específica de área', async () => {
  const calls = [];
  const findActiveByScope = async (scope) => {
    const key = scope.administrativeAreaId === null ? 'generic-default' : 'generic-area';
    calls.push(key);
    return key === 'generic-default' ? baseRule : null;
  };

  const result = await resolveClassificationRule(
    { assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    { findActiveByScope }
  );

  assert.equal(result, baseRule);
  assert.deepEqual(calls, ['generic-area', 'generic-default']);
});

test('una regla específica DEVICES sí coincide con el contexto DEVICES', async () => {
  const expected = { ...baseRule, id: 7, extension_id: 1 };
  const rule = await resolveClassificationRule(
    { deviceId: 25, assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    { findActiveByScope: async () => expected }
  );

  assert.equal(rule.id, 7);
});


test('calcula paginación de inventario basada en offset', () => {
  assert.deepEqual(resolveInventoryPagination({ page: 2, limit: 20 }), {
    page: 2,
    skip: 20,
    take: 20,
  });
});

test('resuelve la regla de un bien solo por equipo, sin fallback genérico', async () => {
  const scopes = [];
  const rule = await resolveClassificationRule(
    { deviceId: 25, assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    {
      findActiveByScope: async (scope) => {
        scopes.push(scope);
        return null;
      },
    }
  );

  assert.equal(rule, null);
  assert.deepEqual(scopes, [{ deviceId: 25 }]);
});

test('clasifica como tecnológica solo la regla con extensión DEVICES', () => {
  assert.equal(isTechnologyRule({ extension: { code: 'DEVICES' } }), true);
  assert.equal(isTechnologyRule({ extension: { code: 'VEHICLES' } }), false);
  assert.equal(isTechnologyRule(null), true);
});
