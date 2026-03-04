import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredString
} from '../../utils/zodValidation.js';

const ubicationIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const updateUbicationBodySchema = z.object({
  name: zRequiredString('El nombre de la ubicación es requerido').refine(
    (value) => String(value).trim().length <= 50,
    { message: 'El nombre de la ubicación no puede exceder 50 caracteres' }
  )
}).passthrough();

const validateUpdateUbication = validateZod({
  params: ubicationIdParamsSchema,
  body: updateUbicationBodySchema
});

export { validateUpdateUbication };
