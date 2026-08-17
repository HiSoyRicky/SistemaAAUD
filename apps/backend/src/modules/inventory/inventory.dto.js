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

  return {
    id: item.id,
    tag: item.tag,
    user: item.user,
    serie: item.serie,
    ip: item.ip,
    transferdate: item.transferdate,
    observation: item.observation,
    id_ubication: isDiscarded ? null : item.id_ubication,
    ubication_name: isDiscarded ? null : item.ubications?.name || null,
    id_department: isDiscarded ? null : item.id_department,
    department_name: isDiscarded ? null : item.departments?.name || null,
    id_device: item.id_device,
    device_name: item.devices?.name || null,
    id_brand: item.id_brand,
    brand_name: item.brands?.name || null,
    id_model: item.id_model,
    model_name: item.models?.name || null,
    id_status: item.id_status,
    status_name: statusName,
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
