// inventory.dto.js

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

const legacyFallbackWarnings = new Set();

export const mapInventoryItem = (item) => {
  const statusName = item.status?.name || null;
  const isDiscarded = normalizeText(statusName) === 'DESCARTADO';
  const technology = item.inventory_devices;

  if (!technology && !legacyFallbackWarnings.has(item.id)) {
    legacyFallbackWarnings.add(item.id);
    console.warn('[inventory] legacy technology fallback', {
      inventoryId: item.id,
    });
  }

  const deviceId = technology?.id_device ?? item.id_device;
  const brandId = technology?.id_brand ?? item.id_brand;
  const modelId = technology?.id_model ?? item.id_model;
  const ip = technology?.ip ?? item.ip;
  const classificationRule = item.asset_classification_rule;
  const classification = classificationRule?.classification || null;
  const assetType = classificationRule?.asset_type || null;
  const extensionType = classificationRule?.extension || null;
  const deviceExtension = technology
    ? {
        id: technology.id,
        id_inventory: technology.id_inventory,
        id_device: technology.id_device,
        id_brand: technology.id_brand,
        id_model: technology.id_model,
        ip: technology.ip,
        device: technology.device || null,
        brand: technology.brand || null,
        model: technology.model || null,
      }
    : null;
  const technologyData = deviceExtension
    ? {
        device: deviceExtension.device,
        brand: deviceExtension.brand,
        model: deviceExtension.model,
        ip: deviceExtension.ip,
      }
    : null;

  return {
    id: item.id,
    tag: item.tag,
    user: item.user,
    serie: item.serie,
    ip,
    transferdate: item.transferdate,
    observation: item.observation,
    description: item.description,
    id_condition: item.id_condition,
    condition_name: item.condition?.name || null,
    id_administrative_area: item.id_administrative_area,
    administrative_area_name: item.administrative_area?.name || null,
    id_ubication: isDiscarded ? null : item.id_ubication,
    ubication_name: isDiscarded ? null : item.ubications?.name || null,
    id_department: isDiscarded ? null : item.id_department,
    department_name: isDiscarded ? null : item.departments?.name || null,
    id_device: deviceId,
    device_name: technology?.device?.name || item.devices?.name || null,
    id_brand: brandId,
    brand_name: technology?.brand?.name || item.brands?.name || null,
    id_model: modelId,
    model_name: technology?.model?.name || item.models?.name || null,
    id_status: item.id_status,
    status_name: statusName,
    classification: classification
      ? {
          id: classification.id,
          code_new: classification.code_new,
          description: classification.description,
          code: classification.code_new,
          name: classification.description,
        }
      : null,
    asset_type: assetType
      ? {
          id: assetType.id,
          code: assetType.code,
          name: assetType.name,
        }
      : null,
    extension: classificationRule
      ? {
          type: extensionType?.code || null,
          extension: extensionType
            ? {
                id: extensionType.id,
                code: extensionType.code,
                name: extensionType.name,
              }
            : null,
          devices: deviceExtension,
          vehicles: null,
          properties: null,
        }
      : null,
    technology: technologyData,
    classification_rule: classificationRule
      ? {
          id: classificationRule.id,
          active: classificationRule.active,
          is_default: classificationRule.is_default,
          classification: classification
            ? {
                id: classification.id,
                code_new: classification.code_new,
                description: classification.description,
                code: classification.code_new,
                name: classification.description,
                parent_id: classification.parent_id,
                level: classification.level,
                is_assignable: classification.is_assignable,
              }
            : null,
          asset_type: assetType
            ? {
                id: assetType.id,
                code: assetType.code,
                name: assetType.name,
              }
            : null,
          extension: classificationRule.extension
            ? {
                id: classificationRule.extension.id,
                code: classificationRule.extension.code,
                name: classificationRule.extension.name,
              }
            : null,
        }
      : null,
  };
};

export const mapInventoryResponse = (inventory) => inventory.map(mapInventoryItem);

export const mapCreateInventoryResponse = (inventory) => ({
  success: true,
  message: 'Dispositivo creado exitosamente',
  inventory: mapInventoryItem(inventory),
});

export const mapUpdateInventoryResponse = (inventory) => ({
  success: true,
  message: 'Equipo actualizado correctamente',
  inventory: mapInventoryItem(inventory),
});
