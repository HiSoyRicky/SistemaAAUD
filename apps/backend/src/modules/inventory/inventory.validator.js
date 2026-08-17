// inventory.validator.js

import {
  validateZod,
  z,
  zOptionalDate,
  zOptionalIP,
  zOptionalInt,
  zOptionalNonEmptyField,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

const inventoryIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const createInventoryBodySchema = z.object({
  tag: zRequiredString('El campo tag es obligatorio'),
  id_ubication: zOptionalInt('El campo id_ubication debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_department: zOptionalInt('El campo id_department debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_device: zRequiredInt('El campo id_device debe ser un número entero'),
  id_brand: zRequiredInt('El campo id_brand debe ser un número entero'),
  id_model: zRequiredInt('El campo id_model debe ser un número entero'),
  serie: zRequiredString('El campo serie es obligatorio'),
  id_status: zRequiredInt('El campo id_status debe ser un número entero'),
  transferdate: zOptionalDate('El campo transferdate debe ser una fecha válida', {
    nullable: true,
    allowEmptyString: true,
  }),
});

const updateInventoryBodySchema = z.object({
  tag: zOptionalNonEmptyField('El campo tag no puede estar vacío'),
  id_ubication: zOptionalInt('El campo id_ubication debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_department: zOptionalInt('El campo id_department debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_device: zOptionalInt('El campo id_device debe ser un número entero'),
  id_brand: zOptionalInt('El campo id_brand debe ser un número entero'),
  id_model: zOptionalInt('El campo id_model debe ser un número entero'),
  serie: zOptionalNonEmptyField('El campo serie no puede estar vacío'),
  ip: zOptionalIP('El campo ip debe ser una dirección IP válida', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_status: zOptionalInt('El campo id_status debe ser un número entero'),
  transferdate: zOptionalDate('El campo transferdate debe ser una fecha válida', {
    nullable: true,
    allowEmptyString: true,
  }),
});

const validateCreateInventory = validateZod({ body: createInventoryBodySchema });

const validateUpdateInventory = validateZod({
  params: inventoryIdParamsSchema,
  body: updateInventoryBodySchema,
});

export { validateCreateInventory, validateUpdateInventory };
