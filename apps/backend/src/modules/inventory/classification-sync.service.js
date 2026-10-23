import { prisma } from '../../config/prisma.js';
import { runWithActivityLoggingSuppressed } from '../../common/services/activityLogger.js';
import * as classificationRulesRepository from './classification-rules.repository.js';
import * as inventoryRepository from './inventory.repository.js';
import { writeInventoryAuditEvent } from './services/inventory-audit.service.js';

export function planItemClassification(item, rulesByDevice) {
  const deviceId = item.device_details?.id_device ?? null;
  const rule = deviceId === null ? null : (rulesByDevice.get(deviceId) ?? null);
  const nextRuleId = rule?.id ?? null;
  const nextAreaId = rule?.administrative_area_id ?? null;

  const data = {};
  if (item.asset_classification_rule_id !== nextRuleId) {
    data.asset_classification_rule_id = nextRuleId;
  }
  if (nextAreaId !== null && item.id_administrative_area !== nextAreaId) {
    data.id_administrative_area = nextAreaId;
  }

  return Object.keys(data).length ? data : null;
}

export async function syncInventoryClassification({ db = prisma, deviceIds = null, userId = null } = {}) {
  const targetDeviceIds =
    deviceIds === null ? null : [...new Set(deviceIds.filter((id) => id !== null && id !== undefined))];

  if (targetDeviceIds?.length === 0) {
    return { scanned: 0, updated: 0 };
  }

  const rules = await classificationRulesRepository.findActiveDeviceRules(db);
  const rulesByDevice = new Map(rules.map((rule) => [rule.device_id, rule]));
  const items = await inventoryRepository.findItemsForClassificationSync(
    { deviceIds: targetDeviceIds },
    db
  );

  return runWithActivityLoggingSuppressed(['inventory_items', 'inventory_item_devices'], async () => {
    let updated = 0;

    for (const item of items) {
      const data = planItemClassification(item, rulesByDevice);
      if (!data) continue;

      const updatedItem = await db.inventory_items.update({
        where: { id: item.id },
        data,
        include: { device_details: true },
      });

      await writeInventoryAuditEvent(db, {
        action: 'UPDATE',
        oldRecord: item,
        newRecord: updatedItem,
        userId,
        source: 'inventory.classification-sync',
      });
      updated += 1;
    }

    return { scanned: items.length, updated };
  });
}
