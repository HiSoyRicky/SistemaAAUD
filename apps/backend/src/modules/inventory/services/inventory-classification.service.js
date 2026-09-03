import AppError from '../../../common/utils/AppError.js';
import * as repository from '../inventory.repository.js';
import * as classificationRulesRepository from '../classification-rules.repository.js';

function assertActiveRule(rule) {
  if (!rule) {
    throw new AppError('La regla de clasificación no existe', 400);
  }

  if (!rule.active) {
    throw new AppError('La regla de clasificación está inactiva', 400);
  }

  if (!rule.classification?.active) {
    throw new AppError('La clasificación patrimonial está inactiva', 400);
  }

  if (!rule.classification.is_assignable) {
    throw new AppError('La clasificación patrimonial no es asignable', 400);
  }

  if (!rule.asset_type?.active) {
    throw new AppError('El tipo general de activo está inactivo', 400);
  }

  if (rule.extension && !rule.extension.active) {
    throw new AppError('La extensión técnica está inactiva', 400);
  }

  return rule;
}

export const validateClassificationRule = (rule) => assertActiveRule(rule);

async function resolveRuleById(ruleId) {
  const parsedRuleId = Number(ruleId);

  if (!Number.isInteger(parsedRuleId) || parsedRuleId <= 0) {
    throw new AppError('ID de regla de clasificación inválido', 400);
  }

  const rule = await classificationRulesRepository.findById(parsedRuleId);
  return assertActiveRule(rule);
}

export const resolveClassificationRule = async (ruleOrContext, options = {}) => {
  const findById = options.findById ?? classificationRulesRepository.findById;
  const findActiveByScope = options.findActiveByScope ?? classificationRulesRepository.findActiveByScope;

  if (typeof ruleOrContext !== 'object' || ruleOrContext === null) {
    const parsedRuleId = Number(ruleOrContext);
    if (!Number.isInteger(parsedRuleId) || parsedRuleId <= 0) {
      throw new AppError('ID de regla de clasificación inválido', 400);
    }
    return assertActiveRule(await findById(parsedRuleId));
  }

  const {
    deviceId = null,
    assetTypeId = null,
    extensionId = null,
    administrativeAreaId = null,
  } = ruleOrContext;

  const candidates = [
    { deviceId, extensionId, administrativeAreaId },
    { deviceId, extensionId, administrativeAreaId: null },
    { deviceId: null, assetTypeId, extensionId, administrativeAreaId },
    { deviceId: null, assetTypeId, extensionId, administrativeAreaId: null, isDefault: true },
  ];

  for (const candidate of candidates) {
    if (candidate.deviceId === null && !Number.isInteger(Number(candidate.assetTypeId))) {
      continue;
    }

    const rule = await findActiveByScope(candidate);
    if (rule) {
      return assertActiveRule(rule);
    }
  }

  return null;
};

export const validateExtensionCompatibility = ({ rule, extensionId = null }) => {
  const validatedRule = assertActiveRule(rule);
  const requestedExtensionId = extensionId === null ? null : Number(extensionId);

  if (extensionId !== null && (!Number.isInteger(requestedExtensionId) || requestedExtensionId <= 0)) {
    throw new AppError('ID de extensión técnica inválido', 400);
  }

  if (validatedRule.extension_id !== requestedExtensionId) {
    throw new AppError('La extensión técnica no es compatible con la regla de clasificación', 400);
  }

  return validatedRule;
};