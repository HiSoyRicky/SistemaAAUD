import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredString
} from '../../utils/zodValidation.js';

const modelIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const modelBodySchema = z.object({
  name: zRequiredString('El nombre es obligatorio'),
  id_brand: zRequiredInt('El id_brand debe ser un entero'),
  id_device: zRequiredInt('El id_device debe ser un entero')
}).passthrough();

const validateCreateModel = validateZod({ body: modelBodySchema });
const validateDeleteModel = validateZod({ params: modelIdParamsSchema });

const validateUpdateModel = validateZod({
  params: modelIdParamsSchema,
  body: modelBodySchema
});

export { validateCreateModel, validateDeleteModel, validateUpdateModel };
