import {
  z,
  validateZod,
  zOptionalInt,
  zOptionalString,
  zRequiredEnum,
  zRequiredInt
} from '../../utils/zodValidation.js';
import { TONER_COLORS } from './toners.constants.js';

const tonerIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const createTonerBodySchema = z.object({
  id_printer_model: zRequiredInt('El modelo de impresora es requerido', { min: 1 }).refine(
    (value) => Number(value) >= 1,
    { message: 'Modelo de impresora inválido' }
  ),
  color: zRequiredEnum(
    TONER_COLORS,
    'El color es requerido',
    'Color de tóner inválido'
  ),
  min_stock: zOptionalInt('El stock mínimo debe ser un número válido', { min: 0 }),
  toner_model: zOptionalString('El modelo de tóner es inválido'),
  name: zOptionalString('El nombre del tóner es inválido')
}).passthrough().superRefine((value, ctx) => {
  if (!value.toner_model && !value.name) {
    ctx.addIssue({
      code: 'custom',
      message: 'El modelo de tóner es requerido',
      path: ['toner_model']
    });
  }
});

const updateTonerBodySchema = z.object({
  id_printer_model: zOptionalInt('Modelo de impresora inválido', { min: 1 }),
  color: z.any().optional().refine(
    (value) => value === undefined || TONER_COLORS.includes(value),
    { message: 'Color de tóner inválido' }
  ),
  min_stock: zOptionalInt('El stock mínimo debe ser un número válido', { min: 0 }),
  toner_model: zOptionalString('El modelo de tóner es inválido'),
  name: zOptionalString('El nombre del tóner es inválido')
}).passthrough().superRefine((value, ctx) => {
  if (
    value.toner_model === undefined &&
    value.name === undefined &&
    value.color === undefined &&
    value.min_stock === undefined &&
    value.id_printer_model === undefined
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'No hay campos para actualizar',
      path: []
    });
  }
});

const validateCreateToner = validateZod({ body: createTonerBodySchema });

const validateUpdateToner = validateZod({
  params: tonerIdParamsSchema,
  body: updateTonerBodySchema
});

const validateDeleteToner = validateZod({ params: tonerIdParamsSchema });

export {
  validateCreateToner,
  validateUpdateToner,
  validateDeleteToner
};
