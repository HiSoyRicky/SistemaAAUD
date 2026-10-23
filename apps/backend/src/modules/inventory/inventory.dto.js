// inventory.dto.js

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export const mapInventoryItem = (item) => {
  const statusName = item.status?.name || null;
  const isDiscarded = normalizeText(statusName) === 'DESCARTADO';
  const technology = item.device_details ?? null;
  const vehicle = item.vehicle_details ?? null;
  const realEstate = item.real_estate_details ?? null;
  const property = item.property_details ?? null;

  const classificationRule = item.asset_classification_rule;
  const classification = classificationRule?.classification || null;
  const assetType = classificationRule?.asset_type || item.asset_type || null;
  const extensionType = classificationRule?.extension || item.extension || null;
  const deviceExtension = technology
    ? {
        id: technology.id,
        item_id: technology.item_id,
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
    serie: technology?.serie ?? null,
    ip: technology?.ip ?? null,
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
    id_device: technology?.id_device ?? classificationRule?.device_id ?? null,
    device_name: technology?.device?.name ?? classificationRule?.device?.name ?? null,
    id_brand: technology?.id_brand ?? null,
    brand_name: technology?.brand?.name ?? vehicle?.make ?? null,
    id_model: technology?.id_model ?? null,
    model_name: technology?.model?.name ?? vehicle?.model ?? null,
    asset_type_name: assetType?.name ?? null,
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
    extension: classificationRule || extensionType
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
          vehicles: vehicle
            ? {
                make: vehicle.make,
                model: vehicle.model,
                model_year: vehicle.model_year,
                plate: vehicle.plate,
                chassis: vehicle.chassis,
                engine: vehicle.engine,
                vehicle_type: vehicle.vehicle_type,
                fuel_type: vehicle.fuel_type,
                mileage: vehicle.mileage,
              }
            : null,
          properties: null,
          real_estate: realEstate
            ? {
                cadastral_number: realEstate.cadastral_number,
                address: realEstate.address,
                area_m2: realEstate.area_m2,
                location_geo: realEstate.location_geo,
              }
            : null,
        }
      : null,
    technology: technologyData,
    vehicle_details: vehicle
      ? {
          make: vehicle.make,
          model: vehicle.model,
          model_year: vehicle.model_year,
          plate: vehicle.plate,
          chassis: vehicle.chassis,
          engine: vehicle.engine,
          vehicle_type: vehicle.vehicle_type,
          fuel_type: vehicle.fuel_type,
          mileage: vehicle.mileage,
        }
      : null,
    real_estate_details: realEstate
      ? {
          cadastral_number: realEstate.cadastral_number,
          address: realEstate.address,
          area_m2: realEstate.area_m2,
          location_geo: realEstate.location_geo,
        }
      : null,
    property_details: property
      ? { material: property.material, dimensions: property.dimensions }
      : null,
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
          administrative_area: classificationRule.administrative_area
            ? {
                id: classificationRule.administrative_area.id,
                name: classificationRule.administrative_area.name,
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
