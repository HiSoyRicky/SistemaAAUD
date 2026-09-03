import AppError from '../../common/utils/AppError.js';
import * as repository from './inventory.repository.js';
import { resolveClassificationRule } from './services/inventory-classification.service.js';

const DEFAULT_BATCH_SIZE = 200;
const MAX_BATCH_SIZE = 500;

function incrementMap(map, key, value = 1) {
  const normalizedKey = String(key ?? 'SIN_VALOR');
  map[normalizedKey] = (map[normalizedKey] || 0) + value;
}

function ensureDeviceSummary(map, deviceId) {
  const key = String(deviceId ?? 'SIN_VALOR');
  if (!map[key]) {
    map[key] = { total: 0, receivesRule: 0, withoutRule: 0, conflicts: 0 };
  }
  return map[key];
}

function normalizeBatchSize(value) {
  const batchSize = Number(value ?? DEFAULT_BATCH_SIZE);
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new AppError(`batch_size debe ser un entero entre 1 y ${MAX_BATCH_SIZE}`, 400);
  }
  return batchSize;
}

async function resolveWithUnknownArea({ deviceId, assetTypeId, extensionId, resolveRule, findCandidates }) {
  const candidates = await findCandidates({ deviceId, assetTypeId, extensionId });
  const areaIds = [...new Set(candidates.map((candidate) => candidate.administrative_area_id).filter((id) => id !== null))];

  if (areaIds.length > 1) {
    return { rule: null, conflict: true, areaIds };
  }

  if (areaIds.length === 1) {
    return {
      rule: await resolveRule({ deviceId, assetTypeId, extensionId, administrativeAreaId: areaIds[0] }),
      conflict: false,
      areaIds,
    };
  }

  return {
    rule: await resolveRule({ deviceId, assetTypeId, extensionId, administrativeAreaId: null }),
    conflict: false,
    areaIds: [],
  };
}

export const buildReconciliationContext = ({ inventory, technologyType, devicesExtension }) => ({
  deviceId: inventory.id_device,
  assetTypeId: inventory.inventory_devices ? technologyType.id : inventory.asset_classification_rule?.asset_type_id ?? null,
  extensionId: inventory.inventory_devices ? devicesExtension.id : inventory.asset_classification_rule?.extension_id ?? null,
  administrativeAreaId: inventory.id_administrative_area,
});

async function resolveInventoryPlan({ inventory, technologyType, devicesExtension, resolveRule, findCandidates }) {
  const context = buildReconciliationContext({ inventory, technologyType, devicesExtension });
  let result;

  if (context.deviceId === null || context.assetTypeId === null || context.extensionId === null) {
    result = { rule: null, conflict: false };
  } else if (context.administrativeAreaId === null) {
    result = await resolveWithUnknownArea({ ...context, resolveRule, findCandidates });
  } else {
    result = { rule: await resolveRule(context), conflict: false };
  }

  return {
    context,
    rule: result.rule || null,
    conflict: Boolean(result.conflict),
    nextRuleId: result.rule?.id ?? null,
    nextAreaId: result.rule?.administrative_area_id ?? null,
    ruleChanged: !result.conflict && inventory.asset_classification_rule_id !== (result.rule?.id ?? null),
    areaChanged: !result.conflict && inventory.id_administrative_area !== (result.rule?.administrative_area_id ?? null),
  };
}

export const runDryRun = async (options = {}) => {
  const batchSize = normalizeBatchSize(options.batchSize);
  const findBatch = options.findBatch ?? repository.findInventoryClassificationBatch;
  const findType = options.findType ?? repository.findAssetTypeByCode;
  const findExtension = options.findExtension ?? repository.findAssetClassificationExtensionByCode;
  const findCandidates = options.findCandidates ?? repository.findActiveClassificationCandidates;
  const resolveRule = options.resolveRule ?? resolveClassificationRule;

  const [technologyType, devicesExtension] = await Promise.all([
    findType('TECHNOLOGY'),
    findExtension('DEVICES'),
  ]);

  if (!technologyType?.active || !devicesExtension?.active) {
    throw new AppError('No están disponibles los catálogos activos TECHNOLOGY y DEVICES', 503);
  }

  const summary = {
    totalInventories: 0,
    wouldReceiveRule: 0,
    wouldReceiveArea: 0,
    wouldChangeRule: 0,
    wouldChangeArea: 0,
    unchanged: 0,
    withoutRule: 0,
    conflicts: 0,
    byDevice: {},
    byRule: {},
    conflictInventoryIds: [],
  };

  let cursorId = null;
  while (true) {
    const batch = await findBatch({ cursorId, take: batchSize });
    if (!batch.length) break;

    for (const inventory of batch) {
      summary.totalInventories += 1;
      const plan = await resolveInventoryPlan({ inventory, technologyType, devicesExtension, resolveRule, findCandidates });
      const result = plan;

      const deviceSummary = ensureDeviceSummary(summary.byDevice, inventory.id_device);
      deviceSummary.total += 1;

      if (result.conflict) {
        summary.conflicts += 1;
        deviceSummary.conflicts += 1;
        summary.conflictInventoryIds.push(inventory.id);
        continue;
      }

      const ruleId = result.rule?.id ?? null;
      if (!ruleId) {
        summary.withoutRule += 1;
        deviceSummary.withoutRule += 1;
        incrementMap(summary.byRule, null);
        continue;
      }

      summary.wouldReceiveRule += 1;
      deviceSummary.receivesRule += 1;
      incrementMap(summary.byRule, ruleId);
      if (plan.ruleChanged) summary.wouldChangeRule += 1;

      const nextAreaId = result.rule.administrative_area_id ?? null;
      if (nextAreaId !== null) summary.wouldReceiveArea += 1;
      if (plan.areaChanged) summary.wouldChangeArea += 1;
      if (!plan.ruleChanged && !plan.areaChanged) summary.unchanged += 1;
    }

    cursorId = batch[batch.length - 1].id;
    if (batch.length < batchSize) break;
  }

  return {
    mode: 'DRY_RUN',
    batchSize,
    ...summary,
  };
};

export const runReconcile = async (options = {}) => {
  const batchSize = normalizeBatchSize(options.batchSize);
  const findBatch = options.findBatch ?? repository.findInventoryClassificationBatch;
  const findType = options.findType ?? repository.findAssetTypeByCode;
  const findExtension = options.findExtension ?? repository.findAssetClassificationExtensionByCode;
  const findCandidates = options.findCandidates ?? repository.findActiveClassificationCandidates;
  const resolveRule = options.resolveRule ?? resolveClassificationRule;
  const transaction = options.transaction ?? ((callback) => repository.withTransaction(callback));
  const updateInventory = options.updateInventory ?? repository.updateReconciledInventory;
  const createAudit = options.createAudit ?? ((tx, data) => tx.activity_logs.create({ data }));
  const currentUser = options.currentUser ?? null;

  const [technologyType, devicesExtension] = await Promise.all([
    findType('TECHNOLOGY'),
    findExtension('DEVICES'),
  ]);

  if (!technologyType?.active || !devicesExtension?.active) {
    throw new AppError('No están disponibles los catálogos activos TECHNOLOGY y DEVICES', 503);
  }

  const summary = {
    total: 0,
    processed: 0,
    updated: 0,
    ruleChanged: 0,
    areaChanged: 0,
    unchanged: 0,
    withoutRule: 0,
    conflicts: 0,
    errors: 0,
    errorDetails: [],
  };

  let cursorId = null;
  while (true) {
    const batch = await findBatch({ cursorId, take: batchSize });
    if (!batch.length) break;
    summary.total += batch.length;

    const plans = [];
    for (const inventory of batch) {
      const plan = await resolveInventoryPlan({ inventory, technologyType, devicesExtension, resolveRule, findCandidates });
      plans.push({ inventory, plan });
    }

    const actionable = plans.filter(({ plan }) => !plan.conflict && plan.rule && (plan.ruleChanged || plan.areaChanged));

    try {
      await transaction(async (tx) => {
        for (const { inventory, plan } of actionable) {
          const oldValues = {
            asset_classification_rule_id: inventory.asset_classification_rule_id,
            id_administrative_area: inventory.id_administrative_area,
          };
          const newValues = {
            asset_classification_rule_id: plan.nextRuleId,
            id_administrative_area: plan.nextAreaId,
          };
          await updateInventory(inventory.id, newValues, tx);
          await createAudit(tx, {
            entity_type: 'BD_INVENTORY',
            entity_id: inventory.id,
            action: 'UPDATE',
            old_values: oldValues,
            new_values: { ...newValues, source: 'classification-reconciliation' },
            user_id: currentUser?.id ?? null,
            source: 'inventory.classification-reconciliation',
          });
        }
      });
    } catch (error) {
      summary.errors += 1;
      summary.errorDetails.push({
        batchStart: batch[0].id,
        batchEnd: batch.at(-1).id,
        message: error.message,
        name: error.name,
        code: error.code ?? null,
      });
      cursorId = batch.at(-1).id;
      summary.processed += batch.length;
      if (batch.length < batchSize) break;
      continue;
    }

    for (const { plan } of plans) {
      summary.processed += 1;
      if (plan.conflict) {
        summary.conflicts += 1;
      } else if (!plan.rule) {
        summary.withoutRule += 1;
      } else if (plan.ruleChanged || plan.areaChanged) {
        summary.updated += 1;
        if (plan.ruleChanged) summary.ruleChanged += 1;
        if (plan.areaChanged) summary.areaChanged += 1;
      } else {
        summary.unchanged += 1;
      }
    }

    cursorId = batch.at(-1).id;
    if (batch.length < batchSize) break;
  }

  return { mode: 'RECONCILE', batchSize, ...summary };
};

export { normalizeBatchSize, resolveWithUnknownArea, resolveInventoryPlan };