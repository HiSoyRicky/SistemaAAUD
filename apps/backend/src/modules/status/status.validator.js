// status.validator.js

import { validateZod, z, zRequiredInt, zRequiredString } from '../../common/utils/zodValidation.js';

const statusIdParamsSchema = z.object({
  id: zRequiredInt('ID de estado inválido', { min: 1 }),
});

const createStatusBodySchema = z.object({
  name: zRequiredString('El nombre del estado es requerido'),
});

const updateStatusBodySchema = z.object({
  name: zRequiredString('El nombre del estado es requerido').refine(
    (value) => String(value).trim().length <= 100,
    { message: 'El nombre del estado no puede exceder 100 caracteres' }
  ),
});

const validateCreateStatus = validateZod({ body: createStatusBodySchema });

const validateUpdateStatus = validateZod({
  params: statusIdParamsSchema,
  body: updateStatusBodySchema,
});

export { validateCreateStatus, validateUpdateStatus };
