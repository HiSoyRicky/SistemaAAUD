export const mapItem = (item) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  description: item.description,
  unit: item.unit,
  category: item.category,
  min_stock: item.min_stock,
  active: item.active,
  current_stock: Array.isArray(item.stock)
    ? item.stock.reduce((total, stock) => total + Number(stock.quantity || 0), 0)
    : undefined,
});

export const mapStock = (stock) => ({
  id: stock.id,
  item_id: stock.item_id,
  item: stock.item ? mapItem(stock.item) : null,
  ubication_id: stock.ubication_id,
  ubication: stock.ubication || null,
  quantity: stock.quantity,
  updated_at: stock.updated_at,
});

export const mapMovement = (movement) => ({
  id: movement.id,
  item_id: movement.item_id,
  item: movement.item ? mapItem(movement.item) : null,
  quantity: movement.quantity,
  movement_type: movement.movement_type,
  previous_stock: movement.previous_stock,
  new_stock: movement.new_stock,
  ubication_id: movement.ubication_id,
  ubication: movement.ubication || null,
  department_id: movement.department_id,
  department: movement.department || null,
  receiver_name: movement.receiver_name,
  vehicle_target: movement.vehicle_target,
  reference: movement.reference,
  observation: movement.observation,
  created_by: movement.created_by,
  user: movement.user
    ? { id: movement.user.id, nombre_completo: movement.user.nombre_completo }
    : null,
  created_at: movement.created_at,
});

export const mapPaginated = ({ data, total, page, limit }) => ({
  data,
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});
