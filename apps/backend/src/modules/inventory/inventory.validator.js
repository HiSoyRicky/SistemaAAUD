// inventory.validator.js

import {
  validateZod,
  z,
  zOptionalDate,
  zOptionalIP,
  zOptionalInt,
  zOptionalNullableString,
  zOptionalNonEmptyField,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

const inventoryIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const createInventoryBodySchema = z.object({
  tag: zRequiredString('El campo tag es obligatorio'),
  description: zOptionalNonEmptyField('El campo description no puede estar vacío'),
  id_ubication: zOptionalInt('El campo id_ubication debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_department: zOptionalInt('El campo id_department debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  user: zOptionalNullableString('El campo user debe ser texto'),
  id_device: zOptionalInt('El campo id_device debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_brand: zOptionalInt('El campo id_brand debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_model: zOptionalInt('El campo id_model debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  serie: zRequiredString('El campo serie es obligatorio'),
  ip: zOptionalIP('El campo ip debe ser una dirección IP válida', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_status: zRequiredInt('El campo id_status debe ser un número entero'),
  id_condition: zOptionalInt('El campo id_condition debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_administrative_area: zOptionalInt(
    'El campo id_administrative_area debe ser un número entero',
    { nullable: true, allowEmptyString: true }
  ),
  asset_classification_rule_id: zOptionalInt(
    'El campo asset_classification_rule_id debe ser un número entero',
    { nullable: true, allowEmptyString: true }
  ),
  asset_type_id: zOptionalInt('El campo asset_type_id debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  extension_id: zOptionalInt('El campo extension_id debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  transferdate: zOptionalDate('El campo transferdate debe ser una fecha válida', {
    nullable: true,
    allowEmptyString: true,
  }),
});

const updateInventoryBodySchema = z.object({
  tag: zOptionalNonEmptyField('El campo tag no puede estar vacío'),
  description: zOptionalNonEmptyField('El campo description no puede estar vacío'),
  id_ubication: zOptionalInt('El campo id_ubication debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_department: zOptionalInt('El campo id_department debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  user: zOptionalNullableString('El campo user debe ser texto'),
  id_device: zOptionalInt('El campo id_device debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_brand: zOptionalInt('El campo id_brand debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_model: zOptionalInt('El campo id_model debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  serie: zOptionalNonEmptyField('El campo serie no puede estar vacío'),
  ip: zOptionalIP('El campo ip debe ser una dirección IP válida', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_status: zOptionalInt('El campo id_status debe ser un número entero'),
  id_condition: zOptionalInt('El campo id_condition debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_administrative_area: zOptionalInt(
    'El campo id_administrative_area debe ser un número entero',
    { nullable: true, allowEmptyString: true }
  ),
  asset_classification_rule_id: zOptionalInt(
    'El campo asset_classification_rule_id debe ser un número entero',
    { nullable: true, allowEmptyString: true }
  ),
  asset_type_id: zOptionalInt('El campo asset_type_id debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  extension_id: zOptionalInt('El campo extension_id debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
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

export {
  createInventoryBodySchema,
  updateInventoryBodySchema,
  validateCreateInventory,
  validateUpdateInventory,
};
