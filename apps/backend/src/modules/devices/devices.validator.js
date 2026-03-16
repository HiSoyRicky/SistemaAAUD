import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredString
} from '../../common/utils/zodValidation.js';

const deviceIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const deviceBodySchema = z.object({
  name: zRequiredString('El nombre es obligatorio')
}).passthrough();

const validateCreateDevice = validateZod({ body: deviceBodySchema });
const validateDeleteDevice = validateZod({ params: deviceIdParamsSchema });

const validateUpdateDevice = validateZod({
  params: deviceIdParamsSchema,
  body: deviceBodySchema
});

export { validateCreateDevice, validateDeleteDevice, validateUpdateDevice };
