import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredString
} from '../../common/utils/zodValidation.js';

const brandIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const brandBodySchema = z.object({
  name: zRequiredString('El nombre es requerido')
}).passthrough();

const validateCreateBrand = validateZod({ body: brandBodySchema });

const validateUpdateBrand = validateZod({
  params: brandIdParamsSchema,
  body: brandBodySchema
});

export { validateCreateBrand, validateUpdateBrand };
