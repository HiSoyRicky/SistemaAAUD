export const mapInventoryItem = (item) => ({
  id: item.id,
  tag: item.tag,
  user: item.user,
  serie: item.serie,
  ip: item.ip,
  transferdate: item.transferdate,
  observation: item.observation,
  id_ubication: item.id_ubication,
  ubication_name: item.ubications?.name || null,
  id_department: item.id_department,
  department_name: item.departments?.name || null,
  id_device: item.id_device,
  device_name: item.devices?.name || null,
  id_brand: item.id_brand,
  brand_name: item.brands?.name || null,
  id_model: item.id_model,
  model_name: item.models?.name || null,
  id_status: item.id_status,
  status_name: item.status?.name || null
});

export const mapInventoryResponse = (inventory) => inventory.map(mapInventoryItem);

export const mapCreateInventoryResponse = (inventory) => ({
  success: true,
  message: 'Dispositivo creado exitosamente',
  inventory: mapInventoryItem(inventory)
});

export const mapUpdateInventoryResponse = (inventory) => ({
  success: true,
  message: 'Equipo actualizado correctamente',
  inventory: mapInventoryItem(inventory)
});
