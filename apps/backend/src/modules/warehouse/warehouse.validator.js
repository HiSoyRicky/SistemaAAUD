import {
  validateZod,
  z,
  zOptionalInt,
  zOptionalNullableString,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';
import { MOVEMENT_TYPES } from './warehouse.service.js';

const idParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const listQuerySchema = z.object({
  page: zOptionalInt('Página inválida', { min: 1 }),
  limit: zOptionalInt('Límite inválido', { min: 1, max: 200 }),
  search: zOptionalNullableString('La búsqueda debe ser texto'),
  active: z.any().optional(),
  category: zOptionalNullableString('La categoría debe ser texto'),
  item_id: zOptionalInt('Insumo inválido', { min: 1 }),
  ubication_id: zOptionalInt('Ubicación inválida', { min: 1 }),
  department_id: zOptionalInt('Departamento inválido', { min: 1 }),
  movement_type: z.any().optional(),
  from: zOptionalNullableString('Fecha inicial inválida'),
  to: zOptionalNullableString('Fecha final inválida'),
});

const createItemBodySchema = z.object({
  code: zOptionalNullableString('El código debe ser texto'),
  name: zRequiredString('El nombre es requerido'),
  unit: zRequiredString('La unidad es requerida'),
  category: zOptionalNullableString('La categoría debe ser texto'),
  min_stock: zOptionalInt('El stock mínimo debe ser válido', { min: 0 }),
  active: z.any().optional(),
});

const updateItemBodySchema = z.object({
  code: zOptionalNullableString('El código debe ser texto'),
  name: z.any().optional(),
  unit: z.any().optional(),
  category: zOptionalNullableString('La categoría debe ser texto'),
  min_stock: zOptionalInt('El stock mínimo debe ser válido', { min: 0 }),
  active: z.any().optional(),
});

const createMovementBodySchema = z.object({
  item_id: zRequiredInt('Insumo inválido', { min: 1 }),
  ubication_id: zOptionalInt('Ubicación inválida', { min: 1, nullable: true }),
  department_id: zOptionalInt('Departamento inválido', {
    min: 1,
    nullable: true,
    allowEmptyString: true,
  }),
  quantity: zRequiredInt('Cantidad inválida', { min: 1 }),
  movement_type: z.any().refine(
    (value) =>
      MOVEMENT_TYPES.includes(
        String(value || '')
          .toUpperCase()
          .trim()
      ),
    { message: 'Tipo de movimiento inválido' }
  ),
  receiver_name: zOptionalNullableString('El receptor debe ser texto'),
  reference: zOptionalNullableString('La referencia debe ser texto'),
  observation: zOptionalNullableString('La observación debe ser texto'),
});

const createBatchOutBodySchema = z.object({
  ubication_id: zRequiredInt('Ubicación inválida', { min: 1 }),
  department_id: zRequiredInt('Departamento inválido', { min: 1 }),
  receiver_name: zRequiredString('El receptor es requerido'),
  items: z
    .array(
      z.object({
        item_id: zRequiredInt('Insumo inválido', { min: 1 }),
        quantity: zRequiredInt('Cantidad inválida', { min: 1 }),
      })
    )
    .min(1, 'Debe agregar al menos un insumo'),
});

const createBatchInBodySchema = z.object({
  items: z
    .array(
      z.object({
        item_id: zRequiredInt('Insumo inválido', { min: 1 }),
        quantity: zRequiredInt('Cantidad inválida', { min: 1 }),
      })
    )
    .min(1, 'Debe agregar al menos un insumo'),
});

export const validateListWarehouse = validateZod({ query: listQuerySchema });
export const validateCreateWarehouseItem = validateZod({ body: createItemBodySchema });
export const validateUpdateWarehouseItem = validateZod({
  params: idParamsSchema,
  body: updateItemBodySchema,
});
export const validateCreateWarehouseMovement = validateZod({ body: createMovementBodySchema });
export const validateCreateWarehouseBatchOut = validateZod({ body: createBatchOutBodySchema });
export const validateCreateWarehouseBatchIn = validateZod({ body: createBatchInBodySchema });
