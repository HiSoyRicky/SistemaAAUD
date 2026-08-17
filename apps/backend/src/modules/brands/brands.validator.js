// brands.validator.js

import { validateZod, z, zRequiredInt, zRequiredString } from '../../common/utils/zodValidation.js';

const brandIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const brandBodySchema = z
  .object({
    name: zRequiredString('El nombre es requerido'),
  })
  .refine(
    (data) => {
      const name = String(data.name || '').trim();
      return name.length > 0;
    },
    { message: 'El nombre no puede estar vacío' }
  );

const validateCreateBrand = validateZod({ body: brandBodySchema });
const validateDeleteBrand = validateZod({ params: brandIdParamsSchema });

const validateUpdateBrand = validateZod({
  params: brandIdParamsSchema,
  body: brandBodySchema,
});

export { validateCreateBrand, validateDeleteBrand, validateUpdateBrand };
