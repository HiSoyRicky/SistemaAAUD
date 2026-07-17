import {
  z,
  validateZod,
  zOptionalInt,
  zOptionalDate,
  zOptionalEnum,
  zOptionalNullableString,
  zOptionalString,
  zRequiredEnum,
  zRequiredInt
} from '../../common/utils/zodValidation.js';
import { MOVEMENT_TYPES } from './tonerMovements.constants.js';

const movementIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const getMovementsQuerySchema = z.object({
  id_toner: zOptionalInt('Tóner inválido', { min: 1 }),
  page: zOptionalInt('Página inválida', { min: 1 }),
  limit: zOptionalInt('Límite inválido', { min: 1 }),
  search: zOptionalString('Búsqueda inválida'),
  movement_type: zOptionalEnum(MOVEMENT_TYPES, 'Tipo de movimiento inválido'),
  from: zOptionalDate('Fecha desde inválida'),
  to: zOptionalDate('Fecha hasta inválida')
}).passthrough();

const createMovementBodySchema = z.object({
  id_toner: zRequiredInt('El tóner es requerido', { min: 1 }).refine(
    (value) => Number(value) >= 1,
    { message: 'Tóner inválido' }
  ),
  movement_type: zRequiredEnum(
    MOVEMENT_TYPES,
    'El tipo de movimiento es requerido',
    'Tipo de movimiento inválido'
  ),
  quantity: zRequiredInt('La cantidad debe ser mayor a 0', { min: 1 }),
  id_department: zOptionalInt('Departamento inválido', { min: 1, nullable: true }),
  id_ubication: zOptionalInt('Ubicación inválida', { min: 1, nullable: true }),
  id_incident: zOptionalInt('Incidencia inválida', { min: 1, nullable: true }),
  reference: zOptionalNullableString('Referencia inválida'),
  receiver_name: zOptionalNullableString('Nombre de receptor inválido')
}).passthrough();

const validateGetMovements = validateZod({ query: getMovementsQuerySchema });
const validateCreateMovement = validateZod({ body: createMovementBodySchema });
const validateUploadDocument = validateZod({ params: movementIdParamsSchema });

export {
  validateGetMovements,
  validateCreateMovement,
  validateUploadDocument
};
