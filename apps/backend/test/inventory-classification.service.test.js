import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveClassificationRule,
  validateClassificationRule,
  validateExtensionCompatibility,
} from '../src/modules/inventory/services/inventory-classification.service.js';
import {
  getClassificationRules,
  resolveCreationMode,
  resolveOptionalTechnologyClassification,
} from '../src/modules/inventory/inventory.service.js';
import { getCatalogs } from '../src/modules/inventory/classification-rules.service.js';
import { resolveTechnologyUpdateMode } from '../src/modules/inventory/services/inventory-update.service.js';
import {
  runDryRun,
  runReconcile,
} from '../src/modules/inventory/classification-reconciliation.service.js';
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

test('el dry-run reconcilia por lotes y reporta distribución sin modificar datos', async () => {
  let batches = 0;
  const result = await runDryRun({
    batchSize: 1,
    findType: async () => ({ id: 3, code: 'TECHNOLOGY', active: true }),
    findExtension: async () => ({ id: 1, code: 'DEVICES', active: true }),
    findBatch: async ({ cursorId }) => {
      batches += 1;
      if (cursorId === null) {
        return [{ id: 10, id_device: 25, id_administrative_area: null, asset_classification_rule_id: null, inventory_devices: { id: 1 }, asset_classification_rule: null }];
      }
      return [];
    },
    findCandidates: async () => [{ administrative_area_id: 1 }],
    resolveRule: async () => ({ id: 9, administrative_area_id: 1 }),
  });

  assert.equal(batches, 2);
  assert.equal(result.totalInventories, 1);
  assert.equal(result.wouldReceiveRule, 1);
  assert.equal(result.wouldReceiveArea, 1);
  assert.equal(result.wouldChangeRule, 1);
  assert.equal(result.wouldChangeArea, 1);
  assert.deepEqual(result.byRule, { 9: 1 });
});

test('reconcile reutiliza el plan del resolver y no actualiza inventarios sin cambios', async () => {
  const updates = [];
  const audits = [];
  const contexts = [];
  const batch = [
    {
      id: 1,
      id_device: 25,
      id_administrative_area: 1,
      asset_classification_rule_id: 9,
      inventory_devices: { id: 1 },
      asset_classification_rule: null,
    },
    {
      id: 2,
      id_device: 25,
      id_administrative_area: null,
      asset_classification_rule_id: null,
      inventory_devices: { id: 2 },
      asset_classification_rule: null,
    },
  ];
  let calls = 0;
  const result = await runReconcile({
    findType: async () => ({ id: 3, active: true }),
    findExtension: async () => ({ id: 1, active: true }),
    findBatch: async ({ cursorId, take }) => {
      contexts.push({ cursorId, take });
      calls += 1;
      return calls === 1 ? batch : [];
    },
    findCandidates: async () => [{ administrative_area_id: 1 }],
    resolveRule: async (context) => {
      if (context.administrativeAreaId === 1) return { id: 9, administrative_area_id: 1 };
      return { id: 12, administrative_area_id: 1 };
    },
    transaction: async (callback) => callback({ activity_logs: { create: async ({ data }) => audits.push(data) } }),
    updateInventory: async (id, data) => updates.push({ id, data }),
    currentUser: { id: 7 },
  });

  assert.deepEqual(contexts, [{ cursorId: null, take: 200 }]);
  assert.deepEqual(updates, [{ id: 2, data: { asset_classification_rule_id: 9, id_administrative_area: 1 } }]);
  assert.equal(audits[0].user_id, 7);
  assert.equal(result.updated, 1);
  assert.equal(result.unchanged, 1);
  assert.equal(result.ruleChanged, 1);
  assert.equal(result.areaChanged, 1);
  assert.equal(result.errors, 0);
});

test('reconcile es idempotente y conserva el inventario sin regla fuera del alcance', async () => {
  let updates = 0;
  let batches = 0;
  const inventory = {
    id: 11,
    id_device: 22,
    id_administrative_area: 2,
    asset_classification_rule_id: null,
    inventory_devices: { id: 11 },
    asset_classification_rule: null,
  };
  const options = {
    findType: async () => ({ id: 3, active: true }),
    findExtension: async () => ({ id: 1, active: true }),
    findBatch: async ({ cursorId }) => {
      if (cursorId !== null || batches++ > 0) return [];
      return [inventory];
    },
    findCandidates: async () => [{ id: 12, administrative_area_id: 1 }],
    resolveRule: async ({ administrativeAreaId }) =>
      administrativeAreaId === 2 ? null : { id: 12, administrative_area_id: 1 },
    transaction: async (callback) => callback({ activity_logs: { create: async () => {} } }),
    updateInventory: async () => { updates += 1; },
  };

  const first = await runReconcile(options);
  assert.equal(first.withoutRule, 1);
  assert.equal(first.updated, 0);
  assert.equal(updates, 0);

  batches = 0;
  const second = await runReconcile(options);
  assert.equal(second.withoutRule, 1);
  assert.equal(second.updated, 0);
  assert.equal(updates, 0);
});

test('reconcile informa rollback del lote cuando falla su transacción', async () => {
  let callbackStarted = false;
  let rolledBack = false;
  const result = await runReconcile({
    findType: async () => ({ id: 3, active: true }),
    findExtension: async () => ({ id: 1, active: true }),
    findBatch: async ({ cursorId }) => cursorId === null
      ? [{ id: 1, id_device: 25, id_administrative_area: 1, asset_classification_rule_id: null, inventory_devices: { id: 1 }, asset_classification_rule: null }]
      : [],
    resolveRule: async () => ({ id: 9, administrative_area_id: 1 }),
    transaction: async (callback) => {
      callbackStarted = true;
      try {
        await callback({ activity_logs: { create: async () => {} } });
      } finally {
        rolledBack = true;
      }
      throw new Error('fallo transaccional');
    },
    updateInventory: async () => {},
  });

  assert.equal(callbackStarted, true);
  assert.equal(rolledBack, true);
  assert.equal(result.errors, 1);
  assert.equal(result.updated, 0);
  assert.equal(result.processed, 1);
});

test('withTransaction existe y acepta un callback transaccional', () => {
  assert.equal(typeof inventoryRepository.withTransaction, 'function');
});

test('reconcile usa el cliente transaccional y reporta errores de lote', async () => {
  const updates = [];
  const audits = [];
  const failure = new Error('fallo transaccional');
  failure.name = 'TestTransactionError';
  failure.code = 'TEST_CODE';
  const tx = {
    activity_logs: { create: async ({ data }) => audits.push(data) },
  };
  let transactionCalls = 0;
  const result = await runReconcile({
    findType: async () => ({ id: 3, active: true }),
    findExtension: async () => ({ id: 1, active: true }),
    findBatch: async ({ cursorId }) => cursorId === null
      ? [
          { id: 1, id_device: 25, id_administrative_area: 1, asset_classification_rule_id: null, inventory_devices: { id: 1 }, asset_classification_rule: null },
          { id: 2, id_device: 25, id_administrative_area: 1, asset_classification_rule_id: null, inventory_devices: { id: 2 }, asset_classification_rule: null },
        ]
      : [],
    resolveRule: async () => ({ id: 9, administrative_area_id: 1 }),
    transaction: async () => {
      transactionCalls += 1;
      throw failure;
    },
    updateInventory: async (id, data, transactionClient) => {
      assert.equal(transactionClient, tx);
      updates.push({ id, data });
    },
  });

  assert.equal(transactionCalls, 1);
  assert.deepEqual(updates, []);
  assert.equal(audits.length, 0);
  assert.equal(result.errors, 1);
  assert.equal(result.errorDetails[0].name, 'TestTransactionError');
  assert.equal(result.errorDetails[0].code, 'TEST_CODE');
  assert.equal(result.errorDetails[0].message, 'fallo transaccional');
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

test('usa el fallback genérico default cuando no existe regla específica', async () => {
  const calls = [];
  const findActiveByScope = async (scope) => {
    const key = scope.deviceId !== null
      ? scope.administrativeAreaId === null ? 'device-global' : 'device-area'
      : scope.administrativeAreaId === null ? 'generic-default' : 'generic-area';
    calls.push(key);
    return key === 'generic-default' ? baseRule : null;
  };

  const result = await resolveClassificationRule(
    { deviceId: 28, assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    { findActiveByScope }
  );

  assert.equal(result, baseRule);
  assert.deepEqual(calls, ['device-area', 'device-global', 'generic-area', 'generic-default']);
});

test('permite creación tecnológica legacy sin regla', async () => {
  assert.equal(await resolveOptionalTechnologyClassification(null), null);
});

test('resuelve modo LEGACY sin clasificación', async () => {
  assert.deepEqual(await resolveCreationMode(null), { mode: 'LEGACY', rule: null });
});

test('resuelve una regla tecnológica válida con la extensión configurada', async () => {
  const resolved = await resolveOptionalTechnologyClassification(1, {
    resolveRule: async () => baseRule,
    findDevicesExtension: async () => ({ id: 10, code: 'DEVICES', active: true }),
  });

  assert.equal(resolved, baseRule);
});

test('resuelve modo TECHNOLOGY con regla DEVICES válida', async () => {
  const result = await resolveCreationMode(1, {
    resolveRule: async () => baseRule,
    findDevicesExtension: async () => ({ id: 10, code: 'DEVICES', active: true }),
  });

  assert.equal(result.mode, 'TECHNOLOGY');
  assert.equal(result.rule, baseRule);
});

test('rechaza una regla cuya extensión no corresponde a tecnología', async () => {
  await assert.rejects(
    () =>
      resolveOptionalTechnologyClassification(1, {
        resolveRule: async () => ({ ...baseRule, extension_id: 11 }),
        findDevicesExtension: async () => ({ id: 10, code: 'DEVICES', active: true }),
      }),
    /no es compatible/
  );
});

test('mantiene modo legacy cuando el activo no tiene clasificación', async () => {
  assert.equal(await resolveTechnologyUpdateMode({ asset_classification_rule: null }), 'LEGACY');
});

test('resuelve modo tecnológico usando la extensión configurada', async () => {
  const mode = await resolveTechnologyUpdateMode(
    { asset_classification_rule: { id: 4 } },
    {
      resolveRule: async () => ({ extension_id: 10 }),
      findDevicesExtension: async () => ({ id: 10, code: 'DEVICES', active: true }),
    }
  );

  assert.equal(mode, 'TECHNOLOGY');
});

test('resuelve modo general para una extensión distinta de DEVICES', async () => {
  const mode = await resolveTechnologyUpdateMode(
    { asset_classification_rule: { id: 3 } },
    {
      resolveRule: async () => ({ extension_id: 20 }),
      findDevicesExtension: async () => ({ id: 10, code: 'DEVICES', active: true }),
    }
  );

  assert.equal(mode, 'GENERAL');
});

test('no usa una regla específica sin extensión para un contexto DEVICES', async () => {
  const rule = await resolveClassificationRule(
    { deviceId: 25, assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    {
      findActiveByScope: async (scope) => {
        if (scope.deviceId === 25 && scope.extensionId === 1) return null;
        if (scope.deviceId === null && scope.administrativeAreaId === 1) {
          return { ...baseRule, id: 3, extension_id: 1 };
        }
        return null;
      },
    }
  );

  assert.equal(rule.id, 3);
});

test('una regla específica DEVICES sí coincide con el contexto DEVICES', async () => {
  const expected = { ...baseRule, id: 7, extension_id: 1 };
  const rule = await resolveClassificationRule(
    { deviceId: 25, assetTypeId: 3, extensionId: 1, administrativeAreaId: 1 },
    { findActiveByScope: async () => expected }
  );

  assert.equal(rule.id, 7);
});

test('un activo descartado con extensión tecnológica permite conservar sus campos tecnológicos', async () => {
  const mode = await resolveTechnologyUpdateMode(
    {
      asset_classification_rule: { id: 9 },
      inventory_devices: { id_device: 25 },
    },
    { extensionId: 1 },
    {
      resolveRule: async () => ({ extension_id: null }),
      findDevicesExtension: async () => ({ id: 1, code: 'DEVICES', active: true }),
    }
  );

  assert.equal(mode, 'TECHNOLOGY');
});

test('calcula paginación de inventario basada en offset', () => {
  assert.deepEqual(resolveInventoryPagination({ page: 2, limit: 20 }), {
    page: 2,
    skip: 20,
    take: 20,
  });
});