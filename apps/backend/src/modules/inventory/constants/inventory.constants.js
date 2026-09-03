// inventory.constants.js

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 200;
export const ALLOWED_HISTORY_ACTIONS = new Set(['CREATE', 'UPDATE', 'DELETE']);
export const IGNORED_DIFF_FIELDS = new Set([
  'id',
  'updated_at',
  'updated_by',
  'created_at',
  'created_by',
  'transfer_snapshot',
  'transfer_request_id',
  'transfer_requester_id',
  'transfer_requester_name',
  'ubications',
  'departments',
  'status',
  'devices',
  'brands',
  'models',
]);
export const HISTORY_FIELD_LABELS = {
  asset_classification_rule_id: 'Regla de clasificación',
  tag: 'Marbete',
  serie: 'Serie',
  user: 'Persona tenedora',
  id_ubication: 'Ubicación',
  id_department: 'Departamento',
  id_status: 'Estado',
  id_device: 'Equipo',
  id_brand: 'Marca',
  id_model: 'Modelo',
  id_condition: 'Condición física',
  id_administrative_area: 'Área administradora',
  ip: 'IP',
  observation: 'Observación',
  transferdate: 'Fecha de traslado',
};
export const INVENTORY_FIELD_PERMISSIONS = {
  id_ubication: 'inventory.update_location',
  id_department: 'inventory.update_department',
  user: 'inventory.update_assignee',
  id_condition: 'inventory.update_condition',
  id_administrative_area: 'inventory.update_administrative_area',
  asset_classification_rule_id: 'inventory.update',
};
export const INVENTORY_FIELD_LABELS = {
  id_ubication: 'Ubicación',
  id_department: 'Departamento',
  user: 'Persona tenedora',
  id_condition: 'Condición física',
  id_administrative_area: 'Área administradora',
};
export const INVENTORY_UPDATE_FIELDS = new Set([
  'tag',
  'id_ubication',
  'id_department',
  'user',
  'id_device',
  'id_brand',
  'id_model',
  'serie',
  'ip',
  'id_status',
  'transferdate',
  'observation',
  'description',
  'id_condition',
  'id_administrative_area',
  'asset_classification_rule_id',
]);
