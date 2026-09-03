import * as repository from '../inventory.repository.js';

export const PREVIEW_STATUSES = Object.freeze({
  SAFE: 'SAFE',
  AMBIGUOUS: 'AMBIGUOUS',
  UNCLASSIFIABLE: 'UNCLASSIFIABLE',
  ALREADY_CLASSIFIED: 'ALREADY_CLASSIFIED',
});

function mapRule(rule) {
  if (!rule) return null;

  return {
    id: rule.id,
    classification: rule.classification
      ? {
          id: rule.classification.id,
          code_new: rule.classification.code_new,
          description: rule.classification.description,
        }
      : null,
    asset_type: rule.asset_type
      ? {
          id: rule.asset_type.id,
          code: rule.asset_type.code,
          name: rule.asset_type.name,
        }
      : null,
    extension: rule.extension
      ? {
          id: rule.extension.id,
          code: rule.extension.code,
          name: rule.extension.name,
        }
      : null,
  };
}

export function buildClassificationPreview(asset) {
  const inventoryId = asset?.id ?? null;
  const tag = asset?.tag ?? null;
  const currentRule = asset?.asset_classification_rule || null;

  if (currentRule) {
    const mappedRule = mapRule(currentRule);

    return {
      inventory_id: inventoryId,
      tag,
      current_classification_rule_id: currentRule.id,
      proposed_classification_rule_id: currentRule.id,
      proposed_classification: mappedRule?.classification || null,
      proposed_asset_type: mappedRule?.asset_type || null,
      proposed_extension: mappedRule?.extension || null,
      confidence: 'HIGH',
      reason: 'El activo ya tiene una regla de clasificación asignada.',
      status: PREVIEW_STATUSES.ALREADY_CLASSIFIED,
    };
  }

  if (!inventoryId || !tag) {
    return {
      inventory_id: inventoryId,
      tag,
      current_classification_rule_id: null,
      proposed_classification_rule_id: null,
      proposed_classification: null,
      proposed_asset_type: null,
      proposed_extension: null,
      confidence: 'NONE',
      reason: 'El activo no tiene los datos mínimos de identificación para revisión.',
      status: PREVIEW_STATUSES.UNCLASSIFIABLE,
    };
  }

  return {
    inventory_id: inventoryId,
    tag,
    current_classification_rule_id: null,
    proposed_classification_rule_id: null,
    proposed_classification: null,
    proposed_asset_type: null,
    proposed_extension: null,
    confidence: 'NONE',
    reason:
      'No existe evidencia patrimonial explícita suficiente; no se infiere clasificación desde datos tecnológicos.',
    status: PREVIEW_STATUSES.AMBIGUOUS,
  };
}

export async function getClassificationPreview() {
  const assets = await repository.findAssetsForClassificationPreview();
  return assets.map(buildClassificationPreview);
}

export function summarizeClassificationPreview(preview) {
  return preview.reduce(
    (summary, row) => {
      summary[row.status] = (summary[row.status] || 0) + 1;
      return summary;
    },
    {
      [PREVIEW_STATUSES.SAFE]: 0,
      [PREVIEW_STATUSES.AMBIGUOUS]: 0,
      [PREVIEW_STATUSES.UNCLASSIFIABLE]: 0,
      [PREVIEW_STATUSES.ALREADY_CLASSIFIED]: 0,
    }
  );
}