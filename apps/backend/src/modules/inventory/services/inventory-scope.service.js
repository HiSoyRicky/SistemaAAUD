// inventory-scope.service.js

import AppError from '../../../common/utils/AppError.js';
import {
  getResolvedUserPermissionCodes,
  hasPermissionCode,
} from '../../../common/rbac/permissions.service.js';
export const INVENTORY_ALL_ASSETS_PERMISSION = 'inventory_assets.manage_all';

export const TECHNOLOGY_SCOPE_WHERE = {
  OR: [
    { asset_classification_rule_id: null },
    {
      asset_classification_rule: {
        is: {
          asset_type: { is: { code: 'TECHNOLOGY' } },
          extension: { is: { code: 'DEVICES' } },
        },
      },
    },
  ],
};

export async function resolveInventoryScope(user) {
  const grantedCodes = await getResolvedUserPermissionCodes(user);

  return {
    technologyOnly: !hasPermissionCode({
      grantedCodes,
      requiredCode: INVENTORY_ALL_ASSETS_PERMISSION,
    }),
  };
}

export function isTechnologyItem(item) {
  const rule = item?.asset_classification_rule ?? null;

  return rule
    ? rule.asset_type?.code === 'TECHNOLOGY' && rule.extension?.code === 'DEVICES'
    : !item?.asset_type?.code || item.asset_type.code === 'TECHNOLOGY';
}

export function assertInventoryItemInScope(item, scope) {
  if (scope?.technologyOnly && !isTechnologyItem(item)) {
    throw new AppError(
      'Solo puedes administrar bienes tecnológicos',
      403,
      'INVENTORY_OUT_OF_SCOPE'
    );
  }
}
